import OpenAI from 'openai'

// OpenAI API key should be server-side only (not NEXT_PUBLIC_)
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

export const openai = apiKey ? new OpenAI({ apiKey }) : null

export interface ExplanationLevel {
  level: 'eli5' | 'beginner' | 'standard' | 'graduate' | 'professor'
  explanation: string
}

export async function generateExplanation(
  question: string,
  userMaterials: Array<{ id?: string; title: string; content: string; subject?: string }> = []
): Promise<{ explanation: string; usedNoteIds: string[] }> {
  if (!openai) {
    return {
      explanation: 'OpenAI API key not configured. Please add your API key to continue.',
      usedNoteIds: []
    }
  }

  if (userMaterials.length === 0) {
    return {
      explanation: 'Please select at least one note to use for the explanation.',
      usedNoteIds: []
    }
  }

  // Prepare user materials content with IDs for tracking
  const userMaterialsContent = userMaterials
    .map(m => {
      const materialId = m.id || ''
      return `[NOTE_ID:${materialId}]\nTitle: ${m.title}\nSubject: ${m.subject || 'General'}\nContent: ${m.content || ''}\n[/NOTE_ID:${materialId}]`
    })
    .join('\n\n---\n\n')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert tutor helping a student understand concepts using their own study notes.

CRITICAL INSTRUCTIONS:
1. The student's notes are the PRIMARY source - use them as much as possible
2. Analyze the student's question to understand:
   - What they're asking about
   - The style/level they want (simple, detailed, technical, etc.) based on how they phrase it
   - Any specific context or requirements they mention
3. Extract relevant information from the student's notes first
4. Only supplement with your general knowledge when:
   - The notes don't cover the concept at all
   - The notes are incomplete and need clarification
   - You need to connect concepts that aren't explicitly connected in the notes
5. Match the explanation style to how they asked:
   - If they say "like I'm 5" or "simple terms" → use very simple language
   - If they ask "what's the difference" → focus on comparisons
   - If they ask "how does X work" → provide step-by-step explanations
   - If they use technical terms → you can use technical language
6. Reference the notes naturally when using information from them

FORMATTING AND LENGTH GUIDELINES:
- DEFAULT: Be CONCISE and to the point. Get straight to the answer without unnecessary preamble
- Only be detailed/verbose if the user explicitly asks for:
  * "detailed explanation"
  * "in-depth"
  * "comprehensive"
  * "explain thoroughly"
  * "more description"
  * "step by step" (for processes)
- Use clear line spacing between major points or sections (double line breaks)
- Structure your response with:
  * Clear paragraphs separated by blank lines
  * Bullet points or numbered lists when appropriate
  * Headers (##) for major sections if the explanation is longer
- Keep paragraphs short (2-4 sentences max) for readability
- Use markdown formatting for clarity (bold for key terms, lists for multiple points)

7. At the end of your response, include a line starting with "NOTES_USED:" followed by comma-separated note IDs (the IDs from [NOTE_ID:...] tags) that you actually used information from

IMPORTANT: Only list note IDs that you actually extracted meaningful information from. If you used general knowledge for most of the answer, only list notes that contributed significantly.`
        },
        {
          role: 'user',
          content: `Student's Question: ${question}

STUDENT'S NOTES:
${userMaterialsContent}

Please explain based on the student's question, using their notes as the primary source. Adapt your explanation style to match how they asked the question.`
        }
      ],
      temperature: 0.7,
    })

    const fullResponse = response.choices[0]?.message?.content || 'Unable to generate explanation.'
    
    // Extract used note IDs from the response
    let explanation = fullResponse
    let usedNoteIds: string[] = []
    
    // Look for NOTES_USED pattern
    const notesUsedMatch = fullResponse.match(/NOTES_USED:\s*([^\n]+)/i)
    if (notesUsedMatch) {
      const noteIdsString = notesUsedMatch[1].trim()
      usedNoteIds = noteIdsString
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0 && userMaterials.some(m => (m.id || '') === id))
      
      // Remove the NOTES_USED line from the explanation
      explanation = fullResponse.replace(/NOTES_USED:.*$/i, '').trim()
    } else {
      // If no explicit note IDs, try to infer from content similarity
      // For now, if we have notes and got a response, assume we used relevant ones
      // This is a fallback - the AI should ideally always include NOTES_USED
      usedNoteIds = userMaterials
        .filter(m => {
          const content = (m.content || '').toLowerCase()
          const questionLower = question.toLowerCase()
          // Check if note content is relevant to the question
          return questionLower.split(' ').some(word => 
            word.length > 3 && content.includes(word)
          )
        })
        .map(m => m.id || '')
        .filter(id => id.length > 0)
    }

    // Post-process explanation for better formatting
    explanation = formatExplanation(explanation)

    return {
      explanation,
      usedNoteIds
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      explanation: 'Error generating explanation. Please check your API key and try again.',
      usedNoteIds: []
    }
  }
}

// Helper function to format explanations with proper spacing
function formatExplanation(text: string): string {
  if (!text) return text

  // Normalize line breaks (ensure consistent spacing)
  let formatted = text
    // Replace multiple blank lines (3+) with double line break
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around headers (but not if already spaced)
    .replace(/([^\n])\n(#{1,6}\s+[^\n]+)/g, '$1\n\n$2')
    .replace(/(#{1,6}\s+[^\n]+)\n([^\n])/g, '$1\n\n$2')
    // Ensure spacing around lists (but not if already spaced)
    .replace(/([^\n])\n([-*+]\s+[^\n]+)/g, '$1\n\n$2')
    .replace(/([^\n])\n(\d+\.\s+[^\n]+)/g, '$1\n\n$2')
    // Ensure paragraphs ending with punctuation are separated by blank lines
    // Only if the next line starts with a capital letter (new sentence/paragraph)
    .replace(/([.!?])\n([A-Z][a-z])/g, '$1\n\n$2')
    // Clean up any remaining triple+ line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return formatted
}

export async function generateQuizFromContent(
  content: string,
  numQuestions: number = 5
): Promise<any[]> {
  if (!openai) {
    return []
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert quiz generator. Create educational quizzes from study materials.'
        },
        {
          role: 'user',
          content: `Generate ${numQuestions} quiz questions from the following content. Return a JSON array with objects containing: question, type (multiple_choice, short_answer, or true_false), options (if multiple_choice), correct_answer, and explanation.\n\nContent:\n${content}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result.questions || []
  } catch (error) {
    console.error('OpenAI API error:', error)
    return []
  }
}

export async function generateFlashcards(
  content: string,
  numCards: number = 10
): Promise<any[]> {
  if (!openai) {
    return []
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert flashcard generator. Create effective flashcards for spaced repetition learning.'
        },
        {
          role: 'user',
          content: `Generate ${numCards} flashcards from the following content. Return a JSON array with objects containing: question, answer, difficulty (easy, medium, or hard), and key_concepts.\n\nContent:\n${content}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result.flashcards || []
  } catch (error) {
    console.error('OpenAI API error:', error)
    return []
  }
}

export async function buildKnowledgeGraph(
  materials: string[]
): Promise<any> {
  if (!openai) {
    return { nodes: [], links: [] }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at building knowledge graphs. Analyze study materials and extract concepts and their relationships.'
        },
        {
          role: 'user',
          content: `Analyze the following study materials and create a knowledge graph. Return JSON with nodes (id, label, type, mastery_level) and links (source, target, relationship_type).\n\nMaterials:\n${materials.join('\n\n---\n\n')}`
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return {
      nodes: result.nodes || [],
      links: result.links || []
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return { nodes: [], links: [] }
  }
}

export async function generateExam(
  materials: string[],
  duration: number = 60,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<any> {
  if (!openai) {
    return { questions: [] }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert exam generator. Create comprehensive exams that test understanding across all study materials.'
        },
        {
          role: 'user',
          content: `Generate a ${duration}-minute ${difficulty} exam from the following materials. Include a mix of question types (multiple choice, short answer, essay, code if applicable). Return JSON with questions array containing: question, type, options (if applicable), correct_answer, points, and explanation.\n\nMaterials:\n${materials.join('\n\n---\n\n')}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return {
      questions: result.questions || [],
      predicted_difficulty: difficulty,
      duration_minutes: duration
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return { questions: [] }
  }
}

export async function cleanHandwrittenNotes(
  imageBase64: string
): Promise<string> {
  if (!openai) {
    return 'OpenAI API key not configured.'
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at converting handwritten notes into clean, structured text with proper headings, summaries, and highlighted definitions.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Convert this handwritten note into clean, structured text. Add headings, create summaries, and highlight important definitions.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.3,
    })

    return response.choices[0]?.message?.content || 'Unable to process image.'
  } catch (error) {
    console.error('OpenAI API error:', error)
    return 'Error processing handwritten notes.'
  }
}

export async function generateStudySchedule(
  subjects: any[],
  deadlines: any[],
  performance: any,
  energyLevel: number
): Promise<any> {
  if (!openai) {
    return { schedule: [] }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert study planner. Create personalized micro-schedules based on deadlines, difficulty, performance, and energy levels.'
        },
        {
          role: 'user',
          content: `Generate a daily study schedule. Subjects: ${JSON.stringify(subjects)}, Deadlines: ${JSON.stringify(deadlines)}, Performance: ${JSON.stringify(performance)}, Energy Level: ${energyLevel}/10. Return JSON with schedule array containing: time, activity, subject, duration_minutes, and priority.`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result
  } catch (error) {
    console.error('OpenAI API error:', error)
    return { schedule: [] }
  }
}

export async function generateContentSchedule(
  goals: any[]
): Promise<any[]> {
  if (!openai) {
    return []
  }

  try {
    // Prepare goals with their materials
    const goalsWithMaterials = goals.map((goal: any) => ({
      title: goal.title,
      subject: goal.subject,
      deadline: goal.deadline,
      priority: goal.priority,
      materials: goal.materials?.map((m: any) => ({
        title: m.title,
        content: m.content?.substring(0, 500) || '', // Limit content length
        subject: m.subject
      })) || []
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert study planner. Create a content-based study plan that organizes topics and concepts from the provided materials in a logical learning order. Focus on what content to study, not when to study it. Organize topics by prerequisites and learning progression.'
        },
        {
          role: 'user',
          content: `Create a content-based study plan for these goals and their supporting documents. Return JSON with a plan array containing objects with: order (number), topic (string), description (string), material (string - which document it comes from), and goal (string - which goal it supports). Organize topics in a logical learning sequence considering prerequisites.\n\nGoals with Materials:\n${JSON.stringify(goalsWithMaterials, null, 2)}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result.plan || []
  } catch (error) {
    console.error('OpenAI API error:', error)
    return []
  }
}

export async function reverseLearningPath(
  problem: string,
  subject: string
): Promise<any> {
  if (!openai) {
    return { concepts: [], materials: [] }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at reverse engineering learning paths. Given a problem, identify all prerequisite concepts and create a study plan.'
        },
        {
          role: 'user',
          content: `Problem: ${problem}\nSubject: ${subject}\n\nIdentify all prerequisite concepts and create a learning path. Return JSON with concepts array (name, description, order) and materials array (title, content, order).`
        }
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result
  } catch (error) {
    console.error('OpenAI API error:', error)
    return { concepts: [], materials: [] }
  }
}

export async function findCitations(
  content: string
): Promise<any[]> {
  if (!openai) {
    return []
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at finding academic sources. Identify potential citations, textbooks, research papers, videos, and websites related to the content.'
        },
        {
          role: 'user',
          content: `Find relevant citations and sources for this content. Return JSON with sources array containing: title, type (textbook, paper, video, website), url (if applicable), and relevance_score.\n\nContent:\n${content}`
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result.sources || []
  } catch (error) {
    console.error('OpenAI API error:', error)
    return []
  }
}

export async function summarizeResearchPaper(
  paperContent: string
): Promise<any> {
  if (!openai) {
    return {}
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert research paper analyzer. Extract key contributions, summarize findings, and generate potential exam questions.'
        },
        {
          role: 'user',
          content: `Analyze this research paper. Return JSON with: summary, key_contributions (array), contrasting_viewpoints (array), and potential_questions (array of objects with question, type, answer).\n\nPaper:\n${paperContent}`
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {}
  }
}

export async function extractWordsFromDocuments(
  materials: any[]
): Promise<any[]> {
  if (!openai) {
    return []
  }

  try {
    const materialsText = materials.map((m: any) => 
      `${m.title || 'Untitled'}\n\n${m.content || ''}`
    ).join('\n\n---\n\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting key terms and concepts from study materials. Identify important words, concepts, and topics that students should focus on.'
        },
        {
          role: 'user',
          content: `Extract key terms, concepts, and important words from these study materials. Return JSON with a words array containing objects with: word (string), frequency (number 1-100 based on importance), category (string like "concept", "term", "formula", "definition"), and related_materials (array of material titles where this word appears). Focus on educational terms, concepts, and important vocabulary.\n\nMaterials:\n${materialsText}`
        }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result.words || []
  } catch (error) {
    console.error('OpenAI API error:', error)
    return []
  }
}

export async function generateQuestionsFromWord(
  word: string,
  materials: any[]
): Promise<any[]> {
  if (!openai) {
    return []
  }

  try {
    // Find materials that contain this word
    const relevantMaterials = materials.filter((m: any) => 
      (m.content || '').toLowerCase().includes(word.toLowerCase()) ||
      (m.title || '').toLowerCase().includes(word.toLowerCase())
    )

    if (relevantMaterials.length === 0) {
      return []
    }

    const materialsText = relevantMaterials.map((m: any) => 
      `${m.title || 'Untitled'}\n\n${m.content || ''}`
    ).join('\n\n---\n\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert quiz generator. Create educational questions focused on a specific term or concept.'
        },
        {
          role: 'user',
          content: `Generate 5-8 questions about "${word}" based on these materials. Return JSON with a questions array containing objects with: question (string), type (multiple_choice, short_answer, or true_false), options (array if multiple_choice), correct_answer (string), and explanation (string).\n\nMaterials:\n${materialsText}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(response.choices[0]?.message?.content || '{}')
    return result.questions || []
  } catch (error) {
    console.error('OpenAI API error:', error)
    return []
  }
}


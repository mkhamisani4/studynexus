import OpenAI from 'openai'

// OpenAI API key should be server-side only (not NEXT_PUBLIC_)
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

export const openai = apiKey ? new OpenAI({ apiKey }) : null

export interface ExplanationLevel {
  level: 'eli5' | 'beginner' | 'standard' | 'graduate' | 'professor'
  explanation: string
}

export async function generateExplanation(
  concept: string,
  context: string,
  level: ExplanationLevel['level'],
  userMaterials: Array<{ title: string; content: string; subject?: string }> = []
): Promise<{ explanation: string; sourceBreakdown: string }> {
  if (!openai) {
    return {
      explanation: 'OpenAI API key not configured. Please add your API key to continue.',
      sourceBreakdown: ''
    }
  }

  const levelPrompts = {
    eli5: 'Explain this like I\'m 5 years old. Use simple words, analogies, and examples a child would understand.',
    beginner: 'Explain this for someone who is just starting to learn. Use simple language and provide clear examples.',
    standard: 'Explain this at a standard student level. Include technical terms but define them clearly.',
    graduate: 'Explain this at a graduate level. Assume familiarity with the field and use appropriate terminology.',
    professor: 'Explain this at a professor/technical expert level. Include deep technical details, mathematical formulations, and advanced concepts.'
  }

  // Prepare user materials content
  const userMaterialsContent = userMaterials.length > 0
    ? `\n\nSTUDENT'S STUDY MATERIALS:\n${userMaterials.map(m => `Title: ${m.title}\nSubject: ${m.subject || 'General'}\nContent: ${m.content}`).join('\n\n---\n\n')}`
    : ''

  // Calculate how much content is from user materials vs online
  const hasUserMaterials = userMaterials.length > 0
  const userMaterialsLength = userMaterials.reduce((sum, m) => sum + (m.content?.length || 0), 0)
  const estimatedUserContribution = userMaterialsLength > 1000 ? 'significant' : userMaterialsLength > 500 ? 'moderate' : 'minimal'

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert tutor. ${levelPrompts[level]}

IMPORTANT INSTRUCTIONS:
1. Use the student's study materials (if provided) as the PRIMARY source for explaining the concept
2. Supplement with your general knowledge when the student's materials don't fully cover the concept
3. Prioritize information from the student's materials to help them connect with what they've already studied
4. When using information from the student's materials, reference them naturally (e.g., "As mentioned in your notes...", "Based on your study materials...")
5. After your explanation, provide a source breakdown showing what percentage came from the student's materials vs. online/general knowledge`
        },
        {
          role: 'user',
          content: `Concept to explain: ${concept}\n\nAdditional context: ${context}${userMaterialsContent}\n\nPlease explain this concept using the student's materials as the primary source, supplemented with your knowledge. After the explanation, provide a source breakdown in this format: "Source: X% from your study materials, Y% from online/general knowledge"`
        }
      ],
      temperature: 0.7,
    })

    const fullResponse = response.choices[0]?.message?.content || 'Unable to generate explanation.'
    
    // Extract source breakdown from the response
    let explanation = fullResponse
    let sourceBreakdown = ''
    
    // Look for source breakdown pattern
    const sourceMatch = fullResponse.match(/Source:\s*([^\n]+)/i)
    if (sourceMatch) {
      sourceBreakdown = sourceMatch[1].trim()
      // Remove the source line from the explanation
      explanation = fullResponse.replace(/Source:.*$/i, '').trim()
    } else {
      // Generate a breakdown based on whether we had user materials
      if (hasUserMaterials) {
        const userPercent = estimatedUserContribution === 'significant' ? 50 : estimatedUserContribution === 'moderate' ? 30 : 15
        const onlinePercent = 100 - userPercent
        sourceBreakdown = `${userPercent}% from your study materials, ${onlinePercent}% from online/general knowledge`
      } else {
        sourceBreakdown = '100% from online/general knowledge (no study materials provided)'
      }
    }

    return {
      explanation,
      sourceBreakdown
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      explanation: 'Error generating explanation. Please check your API key and try again.',
      sourceBreakdown: ''
    }
  }
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

export async function generateWeeklyDigest(
  progress: any,
  weakAreas: string[],
  strongAreas: string[]
): Promise<string> {
  if (!openai) {
    return 'OpenAI API key not configured.'
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a motivational study coach. Create weekly progress summaries that are encouraging and actionable.'
        },
        {
          role: 'user',
          content: `Create a weekly progress digest. Progress: ${JSON.stringify(progress)}, Weak Areas: ${weakAreas.join(', ')}, Strong Areas: ${strongAreas.join(', ')}. Include achievements, areas for improvement, and a recommended plan for next week.`
        }
      ],
      temperature: 0.8,
    })

    return response.choices[0]?.message?.content || 'Unable to generate digest.'
  } catch (error) {
    console.error('OpenAI API error:', error)
    return 'Error generating weekly digest.'
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


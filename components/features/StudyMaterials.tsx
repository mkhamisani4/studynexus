'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, X, Sparkles, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface StudyMaterialsProps {
  setActiveView?: (view: string, data?: any) => void
}

export default function StudyMaterials({ setActiveView }: StudyMaterialsProps = {}) {
  const [materials, setMaterials] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ title: '', subject: '', content: '' })

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error: any) {
      console.error('Error loading materials:', error)
      alert('Failed to load materials: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!newMaterial.title || !newMaterial.subject || !newMaterial.content) {
      alert('Please fill in all fields')
      return
    }

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in')
        return
      }

      const { data, error } = await supabase
        .from('study_materials')
        .insert({
          user_id: user.id,
          title: newMaterial.title,
          subject: newMaterial.subject,
          content: newMaterial.content,
          file_type: 'text'
        })
        .select()
        .single()

      if (error) throw error

      setMaterials([data, ...materials])
      setNewMaterial({ title: '', subject: '', content: '' })
      setShowUpload(false)
    } catch (error: any) {
      console.error('Error uploading material:', error)
      alert('Failed to upload material: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in')
        return
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `study-materials/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('study-materials')
        .getPublicUrl(filePath)

      // Create material record
      const { data, error } = await supabase
        .from('study_materials')
        .insert({
          user_id: user.id,
          title: file.name,
          subject: 'General',
          content: `File uploaded: ${file.name}`,
          file_type: file.type,
          file_url: publicUrl,
          file_size: file.size
        })
        .select()
        .single()

      if (error) throw error

      setMaterials([data, ...materials])
      
      // If it's an image, process with OCR
      if (file.type.startsWith('image/')) {
        // Call OCR API
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result?.toString().split(',')[1]
          if (base64) {
            try {
              const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64 })
              })
              const { cleanedText } = await response.json()
              
              // Update material with cleaned text
              const { error: updateError } = await supabase
                .from('study_materials')
                .update({ content: cleanedText })
                .eq('id', data.id)

              if (!updateError) {
                setMaterials(materials.map(m => m.id === data.id ? { ...m, content: cleanedText } : m))
              }
            } catch (err) {
              console.error('OCR processing error:', err)
            }
          }
        }
        reader.readAsDataURL(file)
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMaterials(materials.filter(m => m.id !== id))
    } catch (error: any) {
      console.error('Error deleting material:', error)
      alert('Failed to delete material: ' + error.message)
    }
  }

  const handleGenerateQuiz = async (materialId: string) => {
    const material = materials.find(m => m.id === materialId)
    if (!material) return

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: material.content,
          numQuestions: 5
        })
      })
      const { questions } = await response.json()
      
      // You can navigate to exam mode or show the quiz
      alert(`Generated ${questions.length} quiz questions!`)
    } catch (error) {
      console.error('Error generating quiz:', error)
      alert('Failed to generate quiz')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Study Materials</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Upload and organize your notes, PDFs, and documents</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {showUpload && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Upload New Material</h2>
            <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Title</label>
              <input
                type="text"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-600"
                placeholder="e.g., Linear Algebra Lecture 3"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Subject</label>
              <input
                type="text"
                value={newMaterial.subject}
                onChange={(e) => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-600"
                placeholder="e.g., Mathematics"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Content</label>
              <textarea
                value={newMaterial.content}
                onChange={(e) => setNewMaterial({ ...newMaterial, content: e.target.value })}
                rows={6}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-slate-600 dark:focus:ring-slate-600"
                placeholder="Paste your notes or content here..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or Upload File</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-700/50">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF, DOC, TXT, or Images (for handwritten notes)</p>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading materials...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No materials uploaded yet. Start by uploading your first study material!</p>
            </div>
          ) : (
            materials.map((material) => (
              <div key={material.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{material.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-500">{material.subject}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(material.id)}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mb-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{material.content}</p>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(material.created_at).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleGenerateQuiz(material.id)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center space-x-1"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Quiz</span>
                    </button>
                  </div>
                  {setActiveView && (
                    <button
                      onClick={() => setActiveView('citations', { materialId: material.id, title: material.title })}
                      className="w-full text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center justify-center space-x-1 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Find Additional Resources</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { 
  AlertCircle,
  ArrowLeft, 
  Award,
  BookOpen, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  ExternalLink,
  FileText, 
  FolderPlus, 
  Heart,
  Link as LinkIcon, 
  Lock,
  MessageSquare,
  Plus, 
  Send,
  Sparkles,
  Trash2, 
  UploadCloud, 
  User, 
  UserPlus, 
  Users, 
  Video, 
  X 
} from 'lucide-react'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const courseId = params?.id as string

  const [course, setCourse] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  
  // Estados del Foro
  const [forumTopics, setForumTopics] = useState<any[]>([])
  const [newReplyContent, setNewReplyContent] = useState<Record<string, string>>({})
  const [isForumModalOpen, setIsForumModalOpen] = useState(false)
  const [forumTitle, setForumTitle] = useState('')
  const [forumQuestion, setForumQuestion] = useState('')
  const [forumClosesAt, setForumClosesAt] = useState('')

  const [activeTab, setActiveTab] = useState<'content' | 'assignments' | 'students' | 'forum'>('content')
  const [loading, setLoading] = useState(true)
  const [openModuleIds, setOpenModuleIds] = useState<Record<string, boolean>>({})

  // Modales
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleDesc, setModuleDesc] = useState('')

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonType, setLessonType] = useState<'text' | 'video' | 'pdf' | 'link'>('text')
  const [lessonContent, setLessonContent] = useState('')

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [assignTitle, setAssignTitle] = useState('')
  const [assignDesc, setAssignDesc] = useState('')
  const [assignDueDate, setAssignDueDate] = useState('')
  const [assignMaxScore, setAssignMaxScore] = useState('20')

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [selectedAssignForSubmit, setSelectedAssignForSubmit] = useState<any>(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [submissionLink, setSubmissionLink] = useState('')

  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [gradeScore, setGradeScore] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [selectedStudentIdToEnroll, setSelectedStudentIdToEnroll] = useState('')

  const loadCourseDetails = async () => {
    if (!courseId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUser(user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setUserProfile(profile)

    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
    if (courseData) setCourse(courseData)

    const { data: modulesData } = await supabase
      .from('modules')
      .select('*, lessons (*)')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })

    if (modulesData) {
      setModules(modulesData)
      if (modulesData.length > 0 && Object.keys(openModuleIds).length === 0) {
        setOpenModuleIds({ [modulesData[0].id]: true })
      }
    }

    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select(`
        *,
        submissions (
          *,
          profiles:student_id (first_name, last_name, email)
        )
      `)
      .eq('course_id', courseId)
      .order('due_date', { ascending: true })

    if (assignmentsData) setAssignments(assignmentsData)

    const { data: enrollmentsData } = await supabase
      .from('enrollments')
      .select('*, profiles:student_id (id, first_name, last_name, email)')
      .eq('course_id', courseId)

    if (enrollmentsData) setEnrolledStudents(enrollmentsData)

    const { data: allStudents } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')

    if (allStudents) setAvailableStudents(allStudents)

    // Cargar Foros
    const { data: topicsData } = await supabase
      .from('forum_topics')
      .select(`
        *,
        profiles:author_id (first_name, last_name, role),
        forum_replies (
          id,
          content,
          created_at,
          author_id,
          profiles:author_id (first_name, last_name, role),
          forum_reply_likes (id, user_id)
        )
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (topicsData) setForumTopics(topicsData)

    setLoading(false)
  }

  useEffect(() => {
    loadCourseDetails()
  }, [courseId])

  const toggleModule = (id: string) => {
    setOpenModuleIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Acciones Foro
  const handleCreateForumTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || userProfile?.role !== 'teacher') return

    const { error } = await supabase.from('forum_topics').insert({
      course_id: courseId,
      author_id: currentUser.id,
      title: forumTitle.trim(),
      content: forumQuestion.trim(),
      closes_at: forumClosesAt ? new Date(forumClosesAt).toISOString() : null
    })

    if (error) {
      alert('Error al iniciar foro: ' + error.message)
    } else {
      setIsForumModalOpen(false)
      setForumTitle('')
      setForumQuestion('')
      setForumClosesAt('')
      await loadCourseDetails()
    }
  }

  const handlePostReply = async (topicId: string) => {
    const text = newReplyContent[topicId]?.trim()
    if (!text || !currentUser) return

    const { error } = await supabase.from('forum_replies').insert({
      topic_id: topicId,
      author_id: currentUser.id,
      content: text
    })

    if (error) {
      alert('Error al publicar respuesta: ' + error.message)
    } else {
      setNewReplyContent((prev) => ({ ...prev, [topicId]: '' }))
      await loadCourseDetails()
    }
  }

  const handleToggleLike = async (replyId: string, likesList: any[]) => {
    if (!currentUser) return
    const existingLike = likesList.find((l) => l.user_id === currentUser.id)

    if (existingLike) {
      await supabase.from('forum_reply_likes').delete().eq('id', existingLike.id)
    } else {
      await supabase.from('forum_reply_likes').insert({
        reply_id: replyId,
        user_id: currentUser.id
      })
    }
    await loadCourseDetails()
  }

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('¿Eliminar este tema de debate y todas sus participaciones?')) return
    await supabase.from('forum_topics').delete().eq('id', topicId)
    await loadCourseDetails()
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('¿Eliminar esta intervención?')) return
    await supabase.from('forum_replies').delete().eq('id', replyId)
    await loadCourseDetails()
  }

  // Métodos habituales de gestión
  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!confirm(`¿Eliminar el tema "${title}"?`)) return
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId)
    if (error) alert('Error: ' + error.message)
    else await loadCourseDetails()
  }

  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(`¿Eliminar la unidad "${title}"?`)) return
    const { error } = await supabase.from('modules').delete().eq('id', moduleId)
    if (error) alert('Error: ' + error.message)
    else await loadCourseDetails()
  }

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('modules').insert({
      course_id: courseId,
      title: moduleTitle.trim(),
      description: moduleDesc.trim(),
      order_index: modules.length + 1,
      is_published: true
    })
    if (error) alert('Error: ' + error.message)
    else {
      setIsModuleModalOpen(false)
      setModuleTitle('')
      setModuleDesc('')
      await loadCourseDetails()
    }
  }

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedModuleId) return
    const { error } = await supabase.from('lessons').insert({
      module_id: selectedModuleId,
      title: lessonTitle.trim(),
      content_type: lessonType,
      content: lessonContent.trim(),
      order_index: 1
    })
    if (error) alert('Error: ' + error.message)
    else {
      setIsLessonModalOpen(false)
      setLessonTitle('')
      setLessonContent('')
      await loadCourseDetails()
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('assignments').insert({
      course_id: courseId,
      title: assignTitle.trim(),
      description: assignDesc.trim(),
      due_date: new Date(assignDueDate).toISOString(),
      max_score: parseFloat(assignMaxScore) || 20,
      allow_late_submissions: true
    })
    if (error) alert('Error: ' + error.message)
    else {
      setIsAssignmentModalOpen(false)
      setAssignTitle('')
      setAssignDesc('')
      setAssignDueDate('')
      await loadCourseDetails()
    }
  }

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignForSubmit || !currentUser) return
    const { error } = await supabase.from('submissions').insert({
      assignment_id: selectedAssignForSubmit.id,
      student_id: currentUser.id,
      content: submissionContent.trim(),
      file_url: submissionLink.trim(),
      file_name: submissionLink.trim() ? 'Enlace adjunto' : 'Texto',
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    if (error) alert('Error: ' + error.message)
    else {
      alert('¡Tarea entregada con éxito!')
      setIsSubmitModalOpen(false)
      setSubmissionContent('')
      setSubmissionLink('')
      await loadCourseDetails()
    }
  }

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission) return
    const { error } = await supabase
      .from('submissions')
      .update({
        grade: parseFloat(gradeScore),
        feedback: gradeFeedback.trim(),
        status: 'graded',
        graded_at: new Date().toISOString()
      })
      .eq('id', selectedSubmission.id)

    if (error) alert('Error: ' + error.message)
    else {
      alert('Calificación guardada.')
      setIsGradingModalOpen(false)
      setGradeScore('')
      setGradeFeedback('')
      await loadCourseDetails()
    }
  }

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentIdToEnroll) return
    const alreadyEnrolled = enrolledStudents.some((e) => e.student_id === selectedStudentIdToEnroll)
    if (alreadyEnrolled) {
      alert('El alumno ya está matriculado.')
      return
    }
    const { error } = await supabase.from('enrollments').insert({
      course_id: courseId,
      student_id: selectedStudentIdToEnroll,
      status: 'active'
    })
    if (error) alert('Error: ' + error.message)
    else {
      alert('Estudiante matriculado.')
      setIsEnrollModalOpen(false)
      setSelectedStudentIdToEnroll('')
      await loadCourseDetails()
    }
  }

  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm('¿Retirar a este estudiante del curso?')) return
    const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId)
    if (error) alert('Error: ' + error.message)
    else await loadCourseDetails()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-emerald-800 font-semibold text-sm">
        Cargando aula virtual MRGR...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Barra superior institucional */}
      <header className="bg-white border-b-2 border-emerald-700 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-xl transition cursor-pointer"
              title="Volver a Mis Cursos"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="relative w-10 h-12 shrink-0 hidden sm:block">
              <Image 
                src="/logo-mrgr.png" 
                alt="Insignia MRGR" 
                fill 
                className="object-contain"
                priority
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded uppercase">
                  {course?.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Año {course?.academic_period}
                </span>
              </div>
              <h1 className="text-base font-extrabold text-slate-800 leading-tight">
                {course?.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-slate-700">
            <div className="w-7 h-7 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold text-xs">
              {userProfile?.first_name?.[0] || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none">
                {userProfile?.first_name} {userProfile?.last_name}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                {userProfile?.role === 'teacher' ? 'Docente' : 'Estudiante'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Banner Informativo del Curso */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-7 text-white shadow-md mb-8 border-b-4 border-amber-400">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-amber-300 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Aula Virtual Oficial — I.E. Mauro R. Giraldo Romero
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{course?.title}</h2>
              <p className="text-emerald-100 text-xs md:text-sm mt-1 max-w-2xl font-normal leading-relaxed">
                {course?.description || 'Espacio pedagógico para el desarrollo de competencias curriculares.'}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-2xl text-center">
                <span className="block text-[10px] uppercase font-bold text-amber-300">Unidades</span>
                <span className="text-lg font-black">{modules.length}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-2xl text-center">
                <span className="block text-[10px] uppercase font-bold text-amber-300">Tareas</span>
                <span className="text-lg font-black">{assignments.length}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-2xl text-center">
                <span className="block text-[10px] uppercase font-bold text-amber-300">Alumnos</span>
                <span className="text-lg font-black">{enrolledStudents.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 mb-8 gap-3 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3.5 text-xs sm:text-sm font-bold transition cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'content'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Contenido y Unidades ({modules.length})
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-3.5 text-xs sm:text-sm font-bold transition cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'assignments'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-500" />
            Tareas y Evaluaciones ({assignments.length})
          </button>

          <button
            onClick={() => setActiveTab('forum')}
            className={`pb-3.5 text-xs sm:text-sm font-bold transition cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'forum'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Foros de Debate ({forumTopics.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3.5 text-xs sm:text-sm font-bold transition cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'students'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            Nómina de Estudiantes ({enrolledStudents.length})
          </button>
        </div>

        {/* PESTAÑA: FORO DE DEBATE */}
        {activeTab === 'forum' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Foros y Debates Académicos</h3>
                <p className="text-xs text-slate-500">Espacio de argumentación dialógica, consultas y valoración entre pares</p>
              </div>
              {userProfile?.role === 'teacher' && (
                <button
                  onClick={() => setIsForumModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Iniciar Debate
                </button>
              )}
            </div>

            {forumTopics.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No hay debates abiertos en este momento</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  {userProfile?.role === 'teacher'
                    ? 'Inicia un nuevo tema de discusión con una pregunta orientadora y límite de tiempo.'
                    : 'Tu docente aún no ha planteado preguntas para debatir en esta sección.'}
                </p>
                {userProfile?.role === 'teacher' && (
                  <button
                    onClick={() => setIsForumModalOpen(true)}
                    className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer border border-emerald-200"
                  >
                    Plantear primera pregunta
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {forumTopics.map((topic) => {
                  const isClosed = topic.closes_at && new Date(topic.closes_at) < new Date()

                  return (
                    <div key={topic.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                      {/* Cabecera del Foro */}
                      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isClosed ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                <Lock className="w-3 h-3" /> Debate Cerrado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <Sparkles className="w-3 h-3 text-emerald-600" /> Debate Activo
                              </span>
                            )}
                            {topic.closes_at && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Cierra el {new Date(topic.closes_at).toLocaleDateString()} a las {new Date(topic.closes_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-extrabold text-slate-900">{topic.title}</h4>
                          <p className="text-xs text-slate-700 mt-2 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line">
                            {topic.content}
                          </p>
                        </div>

                        {userProfile?.role === 'teacher' && (
                          <button
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Eliminar Foro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Lista de Respuestas de Estudiantes */}
                      <div className="mt-5 space-y-3">
                        <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Intervenciones ({topic.forum_replies?.length || 0})
                        </h5>

                        {topic.forum_replies && topic.forum_replies.length > 0 ? (
                          <div className="space-y-2.5">
                            {topic.forum_replies.map((reply: any) => {
                              const likes = reply.forum_reply_likes || []
                              const hasLiked = likes.some((l: any) => l.user_id === currentUser?.id)
                              const isMyReply = reply.author_id === currentUser?.id

                              return (
                                <div key={reply.id} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-extrabold text-slate-800">
                                        {reply.profiles?.first_name} {reply.profiles?.last_name}
                                      </span>
                                      <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.2 rounded uppercase">
                                        {reply.profiles?.role === 'teacher' ? 'Docente' : 'Estudiante'}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {new Date(reply.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                                      {reply.content}
                                    </p>
                                  </div>

                                  {/* Botón Me Gusta Anónimo y Acción Eliminar */}
                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <button
                                      onClick={() => handleToggleLike(reply.id, likes)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                        hasLiked
                                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600'
                                      }`}
                                      title="Me gusta anónimo"
                                    >
                                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                      <span>{likes.length}</span>
                                    </button>

                                    {(isMyReply || userProfile?.role === 'teacher') && (
                                      <button
                                        onClick={() => handleDeleteReply(reply.id)}
                                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                        title="Eliminar intervención"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">
                            Aún no hay intervenciones en este debate. ¡Sé el primero en participar!
                          </p>
                        )}

                        {/* Caja para Responder */}
                        {!isClosed ? (
                          <div className="mt-4 pt-3 flex gap-2">
                            <input
                              type="text"
                              placeholder="Escribe tu argumento o respuesta..."
                              value={newReplyContent[topic.id] || ''}
                              onChange={(e) =>
                                setNewReplyContent((prev) => ({
                                  ...prev,
                                  [topic.id]: e.target.value
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePostReply(topic.id)
                              }}
                              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                            />
                            <button
                              onClick={() => handlePostReply(topic.id)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Participar
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> El plazo para participar en este foro ha concluido.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: CONTENIDO Y UNIDADES */}
        {activeTab === 'content' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Unidades de Aprendizaje</h3>
                <p className="text-xs text-slate-500">Planificación de clases, material de estudio y recursos</p>
              </div>
              {userProfile?.role === 'teacher' && (
                <button
                  onClick={() => setIsModuleModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  Nueva Unidad
                </button>
              )}
            </div>

            {modules.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No hay unidades didácticas creadas</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Estructura las sesiones y material de clase por unidades temáticas.</p>
                {userProfile?.role === 'teacher' && (
                  <button
                    onClick={() => setIsModuleModalOpen(true)}
                    className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer border border-emerald-200"
                  >
                    Crear primera unidad
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {modules.map((mod, idx) => {
                  const isOpen = !!openModuleIds[mod.id]
                  return (
                    <div key={mod.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 transition">
                      <div 
                        onClick={() => toggleModule(mod.id)}
                        className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white hover:bg-slate-50 cursor-pointer transition border-b border-slate-100"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="w-8 h-8 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-sm">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800">{mod.title}</h4>
                            <p className="text-xs text-slate-500">{mod.description || 'Sin descripción adicional'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                          {userProfile?.role === 'teacher' && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedModuleId(mod.id)
                                  setIsLessonModalOpen(true)
                                }}
                                className="flex items-center gap-1.5 text-[11px] font-bold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                Agregar Tema
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteModule(mod.id, mod.title)
                                }}
                                className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg transition hover:bg-red-50"
                                title="Eliminar Unidad"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="p-4 sm:p-6 bg-white divide-y divide-slate-100">
                          {mod.lessons && mod.lessons.length > 0 ? (
                            mod.lessons.map((lesson: any) => (
                              <div key={lesson.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group">
                                <div className="flex items-start gap-3.5 max-w-4xl">
                                  <div className="mt-0.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                                    {lesson.content_type === 'video' && <Video className="w-4 h-4 text-red-600" />}
                                    {lesson.content_type === 'pdf' && <FileText className="w-4 h-4 text-amber-600" />}
                                    {lesson.content_type === 'link' && <LinkIcon className="w-4 h-4 text-emerald-600" />}
                                    {lesson.content_type === 'text' && <BookOpen className="w-4 h-4 text-teal-600" />}
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-xs font-bold text-slate-900">{lesson.title}</h5>
                                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                        {lesson.content_type}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-line leading-relaxed">
                                      {lesson.content}
                                    </p>
                                  </div>
                                </div>

                                {userProfile?.role === 'teacher' && (
                                  <button
                                    onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                    className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg transition hover:bg-red-50 cursor-pointer opacity-80 group-hover:opacity-100"
                                    title="Eliminar Tema"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 text-center py-5 italic">
                              No hay materiales agregados en esta unidad aún.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: TAREAS */}
        {activeTab === 'assignments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Tareas y Evaluaciones</h3>
                <p className="text-xs text-slate-500">Recepción de evidencias y calificación vigesimal (0 a 20)</p>
              </div>
              {userProfile?.role === 'teacher' && (
                <button
                  onClick={() => setIsAssignmentModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Crear Tarea
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No hay tareas programadas</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Crea actividades y fija fechas límite para recibir las evidencias.</p>
                {userProfile?.role === 'teacher' && (
                  <button
                    onClick={() => setIsAssignmentModalOpen(true)}
                    className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer border border-emerald-200"
                  >
                    Crear primera tarea
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {assignments.map((assign) => {
                  const mySubmission = assign.submissions?.find((s: any) => s.student_id === currentUser?.id)
                  
                  return (
                    <div key={assign.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                              Evaluación
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900">{assign.title}</h4>
                          </div>

                          <p className="text-xs text-slate-600 mt-2 max-w-2xl leading-relaxed">
                            {assign.description}
                          </p>

                          <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500 font-semibold">
                            <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              Escala: <strong className="text-slate-900">{assign.max_score} pts</strong>
                            </span>
                            <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                              <Clock className="w-3.5 h-3.5" />
                              Límite: {new Date(assign.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {userProfile?.role === 'student' && (
                          <div>
                            {mySubmission ? (
                              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs min-w-[200px]">
                                <div className="flex items-center gap-1.5 font-bold mb-1.5 text-emerald-800">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  Tarea Entregada
                                </div>
                                {mySubmission.grade !== null && (
                                  <p className="font-extrabold text-emerald-900 text-sm mt-1 bg-white p-2 rounded-xl border border-emerald-100 text-center">
                                    Nota: {mySubmission.grade} / {assign.max_score}
                                  </p>
                                )}
                                {mySubmission.feedback && (
                                  <p className="text-[11px] text-emerald-800 italic mt-2 bg-emerald-100/60 p-2 rounded-xl">
                                    "{mySubmission.feedback}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setSelectedAssignForSubmit(assign)
                                  setIsSubmitModalOpen(true)
                                }}
                                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
                              >
                                <UploadCloud className="w-4 h-4" />
                                Entregar Tarea
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {userProfile?.role === 'teacher' && (
                        <div className="mt-6 pt-5 border-t border-slate-100">
                          <h5 className="text-xs font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-emerald-700" />
                            Entregas Recibidas ({assign.submissions?.length || 0})
                          </h5>
                          {assign.submissions && assign.submissions.length > 0 ? (
                            <div className="space-y-2.5">
                              {assign.submissions.map((sub: any) => (
                                <div key={sub.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div>
                                    <span className="font-bold text-slate-900">
                                      {sub.profiles?.first_name} {sub.profiles?.last_name || sub.profiles?.email}
                                    </span>
                                    <p className="text-slate-600 text-[11px] mt-0.5">{sub.content}</p>
                                    {sub.file_url && (
                                      <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-900 underline text-[11px] font-semibold flex items-center gap-1 mt-1">
                                        <ExternalLink className="w-3 h-3" /> Ver evidencia / enlace adjunto
                                      </a>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {sub.grade !== null ? (
                                      <span className="font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg">
                                        Nota: {sub.grade} pts
                                      </span>
                                    ) : (
                                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-semibold text-[11px]">
                                        Sin calificar
                                      </span>
                                    )}
                                    <button
                                      onClick={() => {
                                        setSelectedSubmission(sub)
                                        setGradeScore(sub.grade?.toString() || '')
                                        setGradeFeedback(sub.feedback || '')
                                        setIsGradingModalOpen(true)
                                      }}
                                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                                    >
                                      {sub.grade !== null ? 'Editar Nota' : 'Calificar'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic py-2">Aún no hay entregas de estudiantes registradas.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: ESTUDIANTES */}
        {activeTab === 'students' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Nómina de Estudiantes</h3>
                <p className="text-xs text-slate-500">Control de matrícula e inscripción en la sección</p>
              </div>
              {userProfile?.role === 'teacher' && (
                <button
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Matricular Estudiante
                </button>
              )}
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No hay estudiantes inscritos en esta sección</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Inscribe a los alumnos registrados para que tengan acceso al material.</p>
                {userProfile?.role === 'teacher' && (
                  <button
                    onClick={() => setIsEnrollModalOpen(true)}
                    className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer border border-emerald-200"
                  >
                    Matricular primer estudiante
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                      <th className="p-4 pl-6">N°</th>
                      <th className="p-4">Estudiante</th>
                      <th className="p-4">Correo Institucional</th>
                      <th className="p-4">Condición</th>
                      <th className="p-4">Fecha Inscripción</th>
                      {userProfile?.role === 'teacher' && <th className="p-4 pr-6 text-right">Acción</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {enrolledStudents.map((enrollment, idx) => (
                      <tr key={enrollment.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 pl-6 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-4 font-bold flex items-center gap-2.5 text-slate-800">
                          <div className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-xs">
                            {enrollment.profiles?.first_name?.[0] || 'E'}
                          </div>
                          <span>{enrollment.profiles?.first_name} {enrollment.profiles?.last_name}</span>
                        </td>
                        <td className="p-4 text-slate-500">{enrollment.profiles?.email}</td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            {enrollment.status || 'Activo'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(enrollment.created_at).toLocaleDateString()}
                        </td>
                        {userProfile?.role === 'teacher' && (
                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={() => handleUnenroll(enrollment.id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="Retirar estudiante"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: INICIAR DEBATE / FORO (DOCENTE) */}
      {isForumModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Plantear Tema de Debate</h3>
            <p className="text-xs text-slate-500 mb-4">Abre una discusión dialógica con fecha de caducidad para el aula:</p>

            <form onSubmit={handleCreateForumTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título o Pregunta Central</label>
                <input
                  type="text"
                  required
                  placeholder="ej. ¿Por qué es fundamental la fotosíntesis en el ecosistema?"
                  value={forumTitle}
                  onChange={(e) => setForumTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instrucciones o Contexto del Debate</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explica a los alumnos qué puntos deben argumentar y qué aspectos tomar en cuenta..."
                  value={forumQuestion}
                  onChange={(e) => setForumQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Límite de Tiempo para Responder (Opcional)</label>
                <input
                  type="datetime-local"
                  value={forumClosesAt}
                  onChange={(e) => setForumClosesAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Pasada esta fecha, el foro se cerrará y solo quedará para lectura.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsForumModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Publicar Debate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MATRICULAR ESTUDIANTE */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Matricular Estudiante</h3>
            <p className="text-xs text-slate-500 mb-4">Selecciona al alumno para concederle acceso al aula virtual:</p>

            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alumno Registrado</label>
                <select
                  required
                  value={selectedStudentIdToEnroll}
                  onChange={(e) => setSelectedStudentIdToEnroll(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">-- Selecciona un alumno --</option>
                  {availableStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.first_name} {st.last_name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Confirmar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR UNIDAD */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-3">Nueva Unidad de Aprendizaje</h3>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la Unidad</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Unidad 1: Ecosistemas y Biomas"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Objetivos</label>
                <textarea
                  rows={3}
                  placeholder="Capacidades y propósitos de la unidad..."
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Guardar Unidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR TEMA */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-3">Agregar Material a la Unidad</h3>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la Sesión / Tema</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Clase 1: El Método Científico"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Recurso</label>
                <select
                  value={lessonType}
                  onChange={(e: any) => setLessonType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="text">Texto / Guía Teórica</option>
                  <option value="video">Video (YouTube / Google Drive)</option>
                  <option value="pdf">Documento PDF / Ficha</option>
                  <option value="link">Enlace Web Externo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contenido o Enlace URL</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe la explicación o pega la URL del material..."
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Publicar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR TAREA */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-3">Programar Nueva Tarea</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título de la Actividad</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Informe de Laboratorio N° 1"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instrucciones y Criterios</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre lo que debe presentar el alumno..."
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    required
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Puntaje Máximo</label>
                  <input
                    type="number"
                    value={assignMaxScore}
                    onChange={(e) => setAssignMaxScore(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-bold focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTREGAR TAREA (ESTUDIANTE) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Entregar Evidencia</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedAssignForSubmit?.title}</p>
            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Comentario / Respuesta</label>
                <textarea
                  rows={3}
                  placeholder="Escribe detalles sobre tu entrega..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enlace a Google Drive o Documento</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Enviar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CALIFICAR (DOCENTE) */}
      {isGradingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Calificar Evidencia</h3>
            <p className="text-xs text-slate-500 mb-4">
              Estudiante: <strong className="text-slate-800">{selectedSubmission?.profiles?.first_name} {selectedSubmission?.profiles?.last_name}</strong>
            </p>
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Calificación (Escala Vigesimal 0 - 20)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  required
                  placeholder="18"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-emerald-800 font-black focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Retroalimentación Pedagógica</label>
                <textarea
                  rows={3}
                  placeholder="Comentarios formativos sobre el trabajo..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGradingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Guardar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
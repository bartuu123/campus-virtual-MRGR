'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  FileText, 
  FolderPlus, 
  Link as LinkIcon, 
  Plus, 
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
  
  const [activeTab, setActiveTab] = useState<'content' | 'assignments' | 'students'>('content')
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

    setLoading(false)
  }

  useEffect(() => {
    loadCourseDetails()
  }, [courseId])

  const toggleModule = (id: string) => {
    setOpenModuleIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Eliminar Tema / Lección
  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!confirm(`¿Eliminar el tema "${title}"?`)) return

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)

    if (error) {
      alert('Error al eliminar: ' + error.message)
    } else {
      await loadCourseDetails()
    }
  }

  // Eliminar Unidad / Módulo
  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(`¿Eliminar la unidad "${title}" y todo su material interno?`)) return

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId)

    if (error) {
      alert('Error al eliminar unidad: ' + error.message)
    } else {
      await loadCourseDetails()
    }
  }

  // Guardar Módulo
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('modules').insert({
      course_id: courseId,
      title: moduleTitle.trim(),
      description: moduleDesc.trim(),
      order_index: modules.length + 1,
      is_published: true
    })

    if (error) {
      alert('Error al guardar unidad: ' + error.message)
    } else {
      setIsModuleModalOpen(false)
      setModuleTitle('')
      setModuleDesc('')
      await loadCourseDetails()
    }
  }

  // Guardar Lección
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

    if (error) {
      alert('Error al guardar tema: ' + error.message)
    } else {
      setIsLessonModalOpen(false)
      setLessonTitle('')
      setLessonContent('')
      await loadCourseDetails()
    }
  }

  // Guardar Tarea
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

    if (error) {
      alert('Error al guardar tarea: ' + error.message)
    } else {
      setIsAssignmentModalOpen(false)
      setAssignTitle('')
      setAssignDesc('')
      setAssignDueDate('')
      await loadCourseDetails()
    }
  }

  // Subir Entrega
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignForSubmit || !currentUser) return

    const { error } = await supabase.from('submissions').insert({
      assignment_id: selectedAssignForSubmit.id,
      student_id: currentUser.id,
      content: submissionContent.trim(),
      file_url: submissionLink.trim(),
      file_name: submissionLink.trim() ? 'Enlace / Archivo adjunto' : 'Texto',
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })

    if (error) {
      alert('Error al enviar la entrega: ' + error.message)
    } else {
      alert('¡Tarea entregada con éxito!')
      setIsSubmitModalOpen(false)
      setSubmissionContent('')
      setSubmissionLink('')
      await loadCourseDetails()
    }
  }

  // Calificar
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

    if (error) {
      alert('Error al calificar: ' + error.message)
    } else {
      alert('Calificación guardada.')
      setIsGradingModalOpen(false)
      setGradeScore('')
      setGradeFeedback('')
      await loadCourseDetails()
    }
  }

  // Matricular
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentIdToEnroll) return

    const alreadyEnrolled = enrolledStudents.some(
      (e) => e.student_id === selectedStudentIdToEnroll
    )

    if (alreadyEnrolled) {
      alert('El alumno ya está matriculado.')
      return
    }

    const { error } = await supabase.from('enrollments').insert({
      course_id: courseId,
      student_id: selectedStudentIdToEnroll,
      status: 'active'
    })

    if (error) {
      alert('Error al matricular: ' + error.message)
    } else {
      alert('Estudiante matriculado.')
      setIsEnrollModalOpen(false)
      setSelectedStudentIdToEnroll('')
      await loadCourseDetails()
    }
  }

  // Desmatricular
  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm('¿Retirar a este estudiante del curso?')) return

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId)

    if (error) {
      alert('Error al retirar: ' + error.message)
    } else {
      await loadCourseDetails()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-medium">
        Cargando aula virtual...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-none">{course?.title}</h1>
              <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">{course?.code}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
            <User className="w-4 h-4 text-slate-500" />
            <span>{userProfile?.first_name || userProfile?.email}</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase text-[10px]">
              {userProfile?.role === 'teacher' ? 'Docente' : 'Estudiante'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3 text-sm font-semibold transition cursor-pointer border-b-2 ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Contenido y Módulos ({modules.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-3 text-sm font-semibold transition cursor-pointer border-b-2 ${
              activeTab === 'assignments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tareas y Evaluaciones ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 text-sm font-semibold transition cursor-pointer border-b-2 ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Estudiantes Matriculados ({enrolledStudents.length})
          </button>
        </div>

        {/* PESTAÑA: CONTENIDO Y MÓDULOS */}
        {activeTab === 'content' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Unidades de Aprendizaje</h3>
                <p className="text-xs text-slate-500">Planificación de clases, recursos y lecturas</p>
              </div>
              {userProfile?.role === 'teacher' && (
                <button
                  onClick={() => setIsModuleModalOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer shadow-sm"
                >
                  <FolderPlus className="w-4 h-4" />
                  Nueva Unidad
                </button>
              )}
            </div>

            {modules.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No hay unidades creadas en este curso.</p>
                {userProfile?.role === 'teacher' && (
                  <button
                    onClick={() => setIsModuleModalOpen(true)}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer mt-3"
                  >
                    Agregar primera unidad
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((mod, idx) => {
                  const isOpen = !!openModuleIds[mod.id]
                  return (
                    <div key={mod.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div 
                        onClick={() => toggleModule(mod.id)}
                        className="flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition border-b border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{mod.title}</h4>
                            <p className="text-xs text-slate-500">{mod.description || 'Sin descripción adicional'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {userProfile?.role === 'teacher' && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedModuleId(mod.id)
                                  setIsLessonModalOpen(true)
                                }}
                                className="flex items-center gap-1 text-[11px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-md transition"
                              >
                                <Plus className="w-3 h-3 text-blue-600" />
                                Agregar Tema
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteModule(mod.id, mod.title)
                                }}
                                className="text-slate-400 hover:text-red-600 p-1 rounded-md transition"
                                title="Eliminar Unidad"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>

                      {/* Lista de Temas */}
                      {isOpen && (
                        <div className="p-4 bg-white divide-y divide-slate-100">
                          {mod.lessons && mod.lessons.length > 0 ? (
                            mod.lessons.map((lesson: any) => (
                              <div key={lesson.id} className="py-3 flex items-start justify-between gap-4 group">
                                <div className="flex items-start gap-3">
                                  {lesson.content_type === 'video' && <Video className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                                  {lesson.content_type === 'pdf' && <FileText className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />}
                                  {lesson.content_type === 'link' && <LinkIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                                  {lesson.content_type === 'text' && <BookOpen className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}

                                  <div>
                                    <h5 className="text-xs font-bold text-slate-800">{lesson.title}</h5>
                                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{lesson.content}</p>
                                  </div>
                                </div>

                                {/* Botón de eliminar tema (Docente) */}
                                {userProfile?.role === 'teacher' && (
                                  <button
                                    onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                    className="text-slate-300 hover:text-red-500 p-1 rounded transition group-hover:opacity-100 cursor-pointer"
                                    title="Eliminar Tema"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 text-center py-4">
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
                <h3 className="text-lg font-bold text-slate-800">Tareas y Entregables</h3>
                <p className="text-xs text-slate-500">Evaluaciones continuas del curso</p>
              </div>
              {userProfile?.role === 'teacher' && (
                <button
                  onClick={() => setIsAssignmentModalOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Crear Tarea
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No hay tareas programadas.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {assignments.map((assign) => {
                  const mySubmission = assign.submissions?.find((s: any) => s.student_id === currentUser?.id)
                  
                  return (
                    <div key={assign.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{assign.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 max-w-xl">{assign.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                              Nota máx: <strong className="text-slate-800">{assign.max_score} pts</strong>
                            </span>
                            <span className="flex items-center gap-1 text-red-600">
                              <Clock className="w-3.5 h-3.5" />
                              Límite: {new Date(assign.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {userProfile?.role === 'student' && (
                          <div>
                            {mySubmission ? (
                              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs">
                                <div className="flex items-center gap-1.5 font-bold mb-1">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  Tarea Entregada
                                </div>
                                {mySubmission.grade !== null && (
                                  <p className="font-semibold text-emerald-900 mt-1">
                                    Nota: {mySubmission.grade} / {assign.max_score}
                                  </p>
                                )}
                                {mySubmission.feedback && (
                                  <p className="text-[11px] text-emerald-700 italic mt-0.5">
                                    Feedback: "{mySubmission.feedback}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setSelectedAssignForSubmit(assign)
                                  setIsSubmitModalOpen(true)
                                }}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer shadow-sm"
                              >
                                <UploadCloud className="w-4 h-4" />
                                Entregar Tarea
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {userProfile?.role === 'teacher' && (
                        <div className="mt-5 pt-4 border-t border-slate-100">
                          <h5 className="text-xs font-bold text-slate-700 mb-3">
                            Entregas recibidas ({assign.submissions?.length || 0})
                          </h5>
                          {assign.submissions && assign.submissions.length > 0 ? (
                            <div className="space-y-2">
                              {assign.submissions.map((sub: any) => (
                                <div key={sub.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-slate-800">
                                      {sub.profiles?.first_name || sub.profiles?.email || 'Estudiante'}
                                    </span>
                                    <p className="text-slate-600 text-[11px] mt-0.5">{sub.content}</p>
                                    {sub.file_url && (
                                      <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-[11px] block mt-0.5">
                                        Ver archivo adjunto / enlace
                                      </a>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {sub.grade !== null ? (
                                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                                        Nota: {sub.grade} pts
                                      </span>
                                    ) : (
                                      <span className="text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                                        Pendiente
                                      </span>
                                    )}
                                    <button
                                      onClick={() => {
                                        setSelectedSubmission(sub)
                                        setGradeScore(sub.grade?.toString() || '')
                                        setGradeFeedback(sub.feedback || '')
                                        setIsGradingModalOpen(true)
                                      }}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-3 py-1.5 rounded transition cursor-pointer"
                                    >
                                      {sub.grade !== null ? 'Modificar Nota' : 'Calificar'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Aún ningún estudiante ha enviado su entrega.</p>
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
                <p className="text-xs text-slate-500">Gestión de alumnos inscritos en esta sección</p>
              </div>
              {userProfile?.role === 'teacher' && (
                <button
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Matricular Estudiante
                </button>
              )}
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No hay estudiantes matriculados todavía.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="p-4">Estudiante</th>
                      <th className="p-4">Correo Institucional</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4">Fecha de Matrícula</th>
                      {userProfile?.role === 'teacher' && <th className="p-4 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {enrolledStudents.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-semibold flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                            {enrollment.profiles?.first_name?.[0] || 'E'}
                          </div>
                          <span>
                            {enrollment.profiles?.first_name} {enrollment.profiles?.last_name}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{enrollment.profiles?.email}</td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {enrollment.status || 'Activo'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(enrollment.created_at).toLocaleDateString()}
                        </td>
                        {userProfile?.role === 'teacher' && (
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleUnenroll(enrollment.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
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

      {/* MODALES */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Matricular Estudiante</h3>
            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Seleccionar Alumno</label>
                <select
                  required
                  value={selectedStudentIdToEnroll}
                  onChange={(e) => setSelectedStudentIdToEnroll(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                >
                  <option value="">-- Elige un estudiante --</option>
                  {availableStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.first_name} {st.last_name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Confirmar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Nueva Unidad o Módulo</h3>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Título de la Unidad</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Unidad 1: Álgebra y Ecuaciones"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción / Objetivos</label>
                <textarea
                  rows={3}
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Guardar Unidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Agregar Material a la Unidad</h3>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Título del Tema</label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Recurso</label>
                <select
                  value={lessonType}
                  onChange={(e: any) => setLessonType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                >
                  <option value="text">Texto / Guía Teórica</option>
                  <option value="video">Video (Enlace YouTube / Drive)</option>
                  <option value="pdf">Documento PDF / Ficha</option>
                  <option value="link">Enlace Externo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Contenido o Enlace URL</label>
                <textarea
                  rows={4}
                  required
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Publicar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssignmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Programar Nueva Tarea</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Título de la Tarea</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Instrucciones</label>
                <textarea
                  rows={3}
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Límite</label>
                  <input
                    type="date"
                    required
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Puntaje Máximo</label>
                  <input
                    type="number"
                    value={assignMaxScore}
                    onChange={(e) => setAssignMaxScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Entregar Actividad</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedAssignForSubmit?.title}</p>
            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Comentarios / Respuesta</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre tu entrega..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Enlace al Archivo / Trabajo</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Enviar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGradingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Calificar Entrega</h3>
            <p className="text-xs text-slate-500 mb-4">
              Alumno: {selectedSubmission?.profiles?.first_name || 'Estudiante'}
            </p>
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nota (0 - 20)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Retroalimentación / Observaciones</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGradingModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Guardar Calificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
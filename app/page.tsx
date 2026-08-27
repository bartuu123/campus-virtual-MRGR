'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { BookOpen, Calendar, GraduationCap, LogOut, Plus, User, X } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estado del modal de crear curso
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [coursePeriod, setCoursePeriod] = useState('2026-I')
  const [savingCourse, setSavingCourse] = useState(false)

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // 1. Obtener perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)

      // 2. Cargar cursos según el rol
      if (profileData.role === 'teacher') {
        // Docente: ve los cursos que imparte
        const { data: teacherCourses } = await supabase
          .from('courses')
          .select('*')
          .eq('teacher_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (teacherCourses) setCourses(teacherCourses)
      } else {
        // Estudiante: ve solo los cursos donde está matriculado
        const { data: studentEnrollments } = await supabase
          .from('enrollments')
          .select('course:course_id (*)')
          .eq('student_id', user.id)

        if (studentEnrollments) {
          const enrolledList = studentEnrollments
            .map((item: any) => item.course)
            .filter((c: any) => c && c.is_active)
          setCourses(enrolledList)
        }
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (profile?.role !== 'teacher') return

    setSavingCourse(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from('courses').insert({
      code: courseCode.trim().toUpperCase(),
      title: courseTitle.trim(),
      description: courseDesc.trim(),
      academic_period: coursePeriod.trim(),
      teacher_id: user.id,
      is_active: true
    })

    if (error) {
      alert('Error al crear el curso: ' + error.message)
    } else {
      setIsModalOpen(false)
      setCourseCode('')
      setCourseTitle('')
      setCourseDesc('')
      await loadData()
    }
    setSavingCourse(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-medium">
        Cargando Campus Virtual...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra superior de navegación */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">Campus Virtual</h1>
              <span className="text-xs text-slate-500">Plataforma Académica</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
              <User className="w-4 h-4 text-slate-500" />
              <span>{profile?.first_name || profile?.email}</span>
              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase text-[10px]">
                {profile?.role === 'teacher' ? 'Docente' : 'Estudiante'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Banner de bienvenida */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md mb-8">
          <h2 className="text-2xl font-bold">¡Bienvenido al Campus, {profile?.first_name || 'Usuario'}!</h2>
          <p className="text-blue-100 text-sm mt-1">
            Revisa tus cursos asignados, gestiona actividades y mantente al día con tus evaluaciones.
          </p>
        </div>

        {/* Sección de Cursos */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Mis Cursos
          </h3>

          {/* El botón de "Nuevo Curso" solo se renderiza si el rol es docente */}
          {profile?.role === 'teacher' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Curso
            </button>
          )}
        </div>

        {/* Listado de Cursos */}
        {courses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No hay cursos disponibles</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {profile?.role === 'teacher'
                ? 'Comienza creando tu primera asignatura para empezar a estructurar unidades y tareas.'
                : 'Aún no estás matriculado en ninguna asignatura. Consulta con tu docente para tu inscripción.'}
            </p>
            {profile?.role === 'teacher' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Crear Curso
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link 
                key={course.id} 
                href={`/courses/${course.id}`}
                className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md">
                      {course.code}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {course.academic_period}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition">
                    {course.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {course.description || 'Sin descripción.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Ingresar al aula</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Crear Nuevo Curso (Solo docentes) */}
      {isModalOpen && profile?.role === 'teacher' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Crear Nueva Asignatura</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Código del Curso</label>
                <input
                  type="text"
                  required
                  placeholder="ej. MAT-401"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre de la Asignatura</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Matemática IV"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Periodo Académico</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 2026-I"
                  value={coursePeriod}
                  onChange={(e) => setCoursePeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Breve descripción del curso..."
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {savingCourse ? 'Guardando...' : 'Crear Asignatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
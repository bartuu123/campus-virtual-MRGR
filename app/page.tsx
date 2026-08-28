'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { 
  Award,
  BookOpen, 
  Calendar, 
  CheckCircle, 
  ClipboardList, 
  GraduationCap, 
  LogOut, 
  Plus, 
  TrendingUp, 
  User, 
  Users, 
  X 
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Métricas del Dashboard
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    averageGrade: 0
  })

  // Modal Nuevo Curso
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [courseCode, setCourseCode] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [coursePeriod, setCoursePeriod] = useState('2026')
  const [savingCourse, setSavingCourse] = useState(false)

  const loadDashboardData = async () => {
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

      if (profileData.role === 'teacher') {
        // Docente: Cursos impartidos
        const { data: teacherCourses } = await supabase
          .from('courses')
          .select(`
            *,
            enrollments (id, student_id),
            assignments (
              id,
              submissions (id, grade, status)
            )
          `)
          .eq('teacher_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (teacherCourses) {
          setCourses(teacherCourses)

          // Cálculo de Métricas Institucionales
          const studentSet = new Set<string>()
          let assignCount = 0
          let subCount = 0
          let sumGrades = 0
          let gradedCount = 0

          teacherCourses.forEach((c: any) => {
            c.enrollments?.forEach((e: any) => studentSet.add(e.student_id))
            c.assignments?.forEach((a: any) => {
              assignCount++
              a.submissions?.forEach((s: any) => {
                subCount++
                if (s.grade !== null && s.grade !== undefined) {
                  sumGrades += parseFloat(s.grade)
                  gradedCount++
                }
              })
            })
          })

          setStats({
            totalCourses: teacherCourses.length,
            totalStudents: studentSet.size,
            totalAssignments: assignCount,
            totalSubmissions: subCount,
            averageGrade: gradedCount > 0 ? parseFloat((sumGrades / gradedCount).toFixed(1)) : 0
          })
        }
      } else {
        // Estudiante: Cursos matriculados
        const { data: studentEnrollments } = await supabase
          .from('enrollments')
          .select('course:course_id (*)')
          .eq('student_id', user.id)

        if (studentEnrollments) {
          const enrolledList = studentEnrollments
            .map((item: any) => item.course)
            .filter((c: any) => c && c.is_active)
          setCourses(enrolledList)
          setStats((prev) => ({ ...prev, totalCourses: enrolledList.length }))
        }
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
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
      await loadDashboardData()
    }
    setSavingCourse(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-emerald-800 font-medium">
        Cargando Campus Virtual MRGR...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra superior de navegación institucional */}
      <header className="bg-white border-b-2 border-emerald-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-14 shrink-0">
              <Image 
                src="/logo-mrgr.png" 
                alt="Insignia I.E. Mauro R. Giraldo Romero" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded uppercase">
                  I.E. INA 52
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Santo Domingo - Piura
                </span>
              </div>
              <h1 className="text-base font-extrabold text-slate-800 leading-tight">
                Mauro Reinaldo Giraldo Romero
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-slate-700">
              <div className="w-7 h-7 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                {profile?.first_name?.[0] || 'U'}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                  {profile?.role === 'teacher' ? 'Docente' : 'Estudiante'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 px-3 py-2 rounded-xl font-semibold transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Banner Institucional */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-8 text-white shadow-lg mb-8 border-b-4 border-amber-400">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block bg-amber-400 text-slate-900 text-[11px] font-extrabold uppercase px-3 py-1 rounded-full mb-3 shadow-sm">
              Año Académico 2026
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Campus Virtual Institucional
            </h2>
            <p className="text-emerald-100 text-sm mt-2 font-normal leading-relaxed">
              Plataforma pedagógica para la gestión de sesiones de aprendizaje, recepción de evidencias evaluativas y acompañamiento escolar.
            </p>
          </div>

          <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none">
            <GraduationCap className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Bloque de Métricas e Indicadores (Solo Docente) */}
        {profile?.role === 'teacher' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-500 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asignaturas</span>
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">{stats.totalCourses}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Secciones activas</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-amber-500 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estudiantes</span>
                <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">{stats.totalStudents}</p>
              <span className="text-[11px] text-amber-700 font-medium">Matriculados en total</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-500 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entregas</span>
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">{stats.totalSubmissions}</p>
              <span className="text-[11px] text-blue-600 font-medium">{stats.totalAssignments} actividades programadas</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-500 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Promedio General</span>
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">
                {stats.averageGrade > 0 ? `${stats.averageGrade} / 20` : '—'}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">Escala vigesimal</span>
            </div>
          </div>
        )}

        {/* Listado de Cursos */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              {profile?.role === 'teacher' ? 'Cursos y Aulas a Cargo' : 'Mis Cursos Matriculados'}
            </h3>
            <p className="text-xs text-slate-500">Acceso a unidades didácticas, materiales y tareas</p>
          </div>

          {profile?.role === 'teacher' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Asignatura
            </button>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">No hay cursos registrados</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {profile?.role === 'teacher'
                ? 'Comienza creando una nueva asignatura para organizar tus unidades didácticas y evaluaciones.'
                : 'Aún no figuras matriculado en ninguna asignatura. Consulta con tu profesor de área.'}
            </p>
            {profile?.role === 'teacher' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Crear Primera Asignatura
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link 
                key={course.id} 
                href={`/courses/${course.id}`}
                className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-600 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md">
                      {course.code}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {course.academic_period}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition">
                    {course.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {course.description || 'Sin descripción curricular asignada.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Ingresar al aula virtual</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Crear Nueva Asignatura (Docente) */}
      {isModalOpen && profile?.role === 'teacher' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Nueva Asignatura / Curso</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código o Sección</label>
                <input
                  type="text"
                  required
                  placeholder="ej. MAT-4TO-UDAIV"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Área Curricular / Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Matemática VI"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Periodo / Año Académico</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 2026"
                  value={coursePeriod}
                  onChange={(e) => setCoursePeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Competencias</label>
                <textarea
                  rows={3}
                  placeholder="Competencias y capacidades a desarrollar..."
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {savingCourse ? 'Guardando...' : 'Registrar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
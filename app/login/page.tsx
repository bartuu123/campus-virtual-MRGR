'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  GraduationCap, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  UserCheck 
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('student')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Función para iniciar sesión o registrarse
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()

    if (isRegistering) {
      // Registro normal
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role: role
          }
        }
      })

      if (error) {
        setErrorMsg('Error al registrarse: ' + error.message)
      } else {
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: cleanEmail,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role: role
          })
        }
        router.push('/')
      }
    } else {
      // 1. Intentar inicio de sesión estándar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      })

      if (!signInError) {
        router.push('/')
        setLoading(false)
        return
      }

      // 2. Si falla por esquema/precarga, verificar si el perfil existe y sincronizar acceso
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .single()

      if (existingProfile) {
        // Inicializar la cuenta en el motor de autenticación
        const { data: signUpData, error: autoSignUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              first_name: existingProfile.first_name,
              last_name: existingProfile.last_name,
              role: existingProfile.role
            }
          }
        })

        if (!autoSignUpError && signUpData.user) {
          await supabase.from('profiles').update({
            id: signUpData.user.id
          }).eq('email', cleanEmail)

          router.push('/')
          setLoading(false)
          return
        }
      }

      setErrorMsg('Credenciales no válidas. Revisa tu correo o contraseña institucional.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 font-sans">
      {/* PANEL IZQUIERDO: Branding Institucional (Impacto Visual para Dirección) */}
      <div className="md:w-1/2 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-8 md:p-14 flex flex-col justify-between relative overflow-hidden text-white border-b-4 md:border-b-0 md:border-r-4 border-amber-400">
        {/* Adorno visual de fondo */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabecera del panel izquierdo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative w-14 h-16 shrink-0 drop-shadow-md">
            <Image 
              src="/logo-mrgr.png" 
              alt="Insignia I.E. Mauro Reinaldo Giraldo Romero" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="inline-block bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest shadow-sm">
              I.E. INA 52
            </span>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">
              Mauro R. Giraldo Romero
            </h1>
            <p className="text-[11px] text-emerald-200 font-medium">Santo Domingo — Morropón, Piura</p>
          </div>
        </div>

        {/* Mensaje Principal y Propuesta de Valor */}
        <div className="relative z-10 my-10 md:my-0 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-600/50 text-emerald-200 text-xs font-semibold mb-5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Sistema de Gestión del Aprendizaje 2026
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
            Innovación y Excelencia en el Aula Virtual
          </h2>
          <p className="text-emerald-100/90 text-sm mt-4 font-normal leading-relaxed">
            Plataforma académica diseñada para centralizar sesiones de aprendizaje, recepción de evidencias evaluativas y acompañamiento pedagógico integral.
          </p>

          {/* Viñetas de características institucionales */}
          <div className="mt-8 space-y-3.5">
            <div className="flex items-center gap-3 text-xs font-medium text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Organización modular por Unidades Didácticas y Competencias</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Recepción y calificación de tareas escolares </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Monitoreo en tiempo real para docentes y estudiantes</span>
            </div>
          </div>
        </div>

        {/* Pie del panel izquierdo */}
        <div className="relative z-10 pt-4 border-t border-emerald-800/80 text-[11px] text-emerald-300 flex items-center justify-between">
          <span>Colegio con formación Técnica</span>
          <span>Año Académico 2026</span>
        </div>
      </div>

      {/* PANEL DERECHO: Formulario de Acceso y Registro */}
      <div className="md:w-1/2 bg-slate-50 p-6 md:p-14 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-200/80">
          
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {isRegistering ? 'Crear Nueva Cuenta' : 'Acceso al Campus'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isRegistering 
                ? 'Ingresa tus datos para registrarte en el sistema' 
                : 'Digita tus credenciales institucionales para ingresar'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombres</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. José Gustavo"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Apellidos</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Barturén"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Usuario / Rol</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                  >
                    <option value="student">Estudiante</option>
                    <option value="teacher">Docente</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 mt-2 border-b-2 border-emerald-900"
            >
              {loading 
                ? 'Procesando...' 
                : isRegistering 
                  ? 'Registrar Cuenta' 
                  : 'Ingresar a la Plataforma'}
            </button>
          </form>

          {/* Alternar entre Iniciar Sesión y Registrarse */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering)
                setErrorMsg('')
              }}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 transition cursor-pointer"
            >
              {isRegistering
                ? '¿Ya tienes una cuenta registrada? Inicia Sesión'
                : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
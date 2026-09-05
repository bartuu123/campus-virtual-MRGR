import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ngwpjocoznmrmjphuuxg.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd3Bqb2Nvem5tcm1qcGh1dXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc5MjY5NiwiZXhwIjoyMTAzMzY4Njk2fQ.gHXeWFXAesop3fgwLO40hGdgqImMFdOzjNCU7cUkXyc'

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const students = [
  { email: 'diego.castillo@mrgr.edu.pe', password: 'castillo494*', first_name: 'Diego Alonso', last_name: 'Castillo Ramírez' },
  { email: 'deyner.chumacero@mrgr.edu.pe', password: 'chumacero590*', first_name: 'Deyner Ivan', last_name: 'Chumacero Córdova' },
  { email: 'marie.chumacero@mrgr.edu.pe', password: 'chumacero162*', first_name: 'Marie Edelyn', last_name: 'Chumacero Velásquez' },
  { email: 'vannya.dominguez@mrgr.edu.pe', password: 'dominguez731*', first_name: 'Vannya Briyit', last_name: 'Domínguez Chumacero' },
  { email: 'leydi.dominguez@mrgr.edu.pe', password: 'dominguez408*', first_name: 'Leydi', last_name: 'Domínguez Córdova' },
  { email: 'keimy.garcia@mrgr.edu.pe', password: 'garcia275*', first_name: 'Keimy Yamilet', last_name: 'García Berru' },
  { email: 'hilder.lopez@mrgr.edu.pe', password: 'lopez819*', first_name: 'Hilder Joel', last_name: 'Lopez Chumacero' },
  { email: 'karen.lopez@mrgr.edu.pe', password: 'lopez364*', first_name: 'Karen Yudith', last_name: 'Lopez Córdova' },
  { email: 'renelia.lopez@mrgr.edu.pe', password: 'lopez527*', first_name: 'Renelia Carolina', last_name: 'Lopez Neira' },
  { email: 'luana.mejia@mrgr.edu.pe', password: 'mejia693*', first_name: 'Luana Ximena', last_name: 'Mejia Rojas' },
  { email: 'emerson.ramirez@mrgr.edu.pe', password: 'ramirez241*', first_name: 'Emerson Josue', last_name: 'Ramirez Lopez' },
  { email: 'jhon.zuniga@mrgr.edu.pe', password: 'zuniga856*', first_name: 'Jhon Paolo', last_name: 'Zuniga Aguilar' },
  { email: 'harold.adrianzen@mrgr.edu.pe', password: 'adrianzen317*', first_name: 'Harold Sebastian', last_name: 'Adrianzen Ramirez' },
  { email: 'lesly.chumacero@mrgr.edu.pe', password: 'chumacero742*', first_name: 'Lesly Yanixa', last_name: 'Chumacero Choquehuanca' },
  { email: 'smith.cordova@mrgr.edu.pe', password: 'cordova529*', first_name: 'Smith Marilyn', last_name: 'Cordova Pintado' },
  { email: 'iris.dominguez@mrgr.edu.pe', password: 'dominguez184*', first_name: 'Iris Roxana', last_name: 'Dominguez Calle' },
  { email: 'mario.garcia@mrgr.edu.pe', password: 'garcia673*', first_name: 'Mario Jhoao Rafael', last_name: 'Garcia Aguilar' },
  { email: 'lili.garcia@mrgr.edu.pe', password: 'garcia905*', first_name: 'Lili Sarita', last_name: 'Garcia Ambul ay' },
  { email: 'alberth.garcia@mrgr.edu.pe', password: 'garcia438*', first_name: 'Alberth Leonel', last_name: 'Garcia Castillo' },
  { email: 'carlos.jimenez@mrgr.edu.pe', password: 'jimenez762*', first_name: 'Carlos Julian', last_name: 'Jimenez Cordova' },
  { email: 'cruz.lopez@mrgr.edu.pe', password: 'lopez351*', first_name: 'Cruz Maria', last_name: 'Lopez Rosillo' },
  { email: 'manuel.sosa@mrgr.edu.pe', password: 'sosa614*', first_name: 'Manuel Adrian', last_name: 'Sosa Ballesteros' },
  { email: 'keyla.umbo@mrgr.edu.pe', password: 'umbo287*', first_name: 'Keyla Anahi', last_name: 'Umbo Flores' },
  { email: 'santiago.velasquez@mrgr.edu.pe', password: 'velasquez936*', first_name: 'Santiago', last_name: 'Velasquez Cepeda' },
  { email: 'lessly.aguilar@mrgr.edu.pe', password: 'aguilar472*', first_name: 'Lessly Marely', last_name: 'Aguilar Jimenez' },
  { email: 'euden.berru@mrgr.edu.pe', password: 'berru805*', first_name: 'Euden Eduardo', last_name: 'Berru Cordova' },
  { email: 'fiorela.calle@mrgr.edu.pe', password: 'calle329*', first_name: 'Fiorela', last_name: 'Calle Peña' },
  { email: 'juan.castillo@mrgr.edu.pe', password: 'castillo671*', first_name: 'Juan Francisco', last_name: 'Castillo Jimenez' },
  { email: 'maria.chumacero@mrgr.edu.pe', password: 'chumacero593*', first_name: 'Maria Isabel', last_name: 'Chumacero Ambul ay' },
  { email: 'henry.chumacero@mrgr.edu.pe', password: 'chumacero746*', first_name: 'Henry Nolberto', last_name: 'Chumacero Cordova' },
  { email: 'dayser.chumacero@mrgr.edu.pe', password: 'chumacero218*', first_name: 'Dayser Ximena', last_name: 'Chumacero Velasquez' },
  { email: 'diego.condezo@mrgr.edu.pe', password: 'condezo854*', first_name: 'Diego Del Piero', last_name: 'Condezo Morales' },
  { email: 'analia.cordova@mrgr.edu.pe', password: 'cordova463*', first_name: 'Analia', last_name: 'Cordova Aguilar' },
  { email: 'sheyli.cordova@mrgr.edu.pe', password: 'cordova729*', first_name: 'Sheyli Lissett', last_name: 'Cordova Castillo' },
  { email: 'maria.cordova@mrgr.edu.pe', password: 'cordova186*', first_name: 'Maria Mercedes', last_name: 'Cordova Chumacero' },
  { email: 'cleyver.cordova@mrgr.edu.pe', password: 'cordova542*', first_name: 'Cleyver', last_name: 'Cordova Cordova' },
  { email: 'dellvi.cordova@mrgr.edu.pe', password: 'cordova913*', first_name: 'Dellvi Yetimar', last_name: 'Cordova Humbo' },
  { email: 'edinson.cordova@mrgr.edu.pe', password: 'cordova357*', first_name: 'Edinson Juan', last_name: 'Cordova Jimenez' },
  { email: 'ivanna.cordova@mrgr.edu.pe', password: 'cordova681*', first_name: 'Ivanna Antuaneth', last_name: 'Cordova Sanchez' },
  { email: 'mayra.cruz@mrgr.edu.pe', password: 'cruz294*', first_name: 'Mayra Fernanda', last_name: 'Cruz Pedemonte' },
  { email: 'milagros.garcia@mrgr.edu.pe', password: 'garcia817*', first_name: 'Milagros Micaela', last_name: 'Garcia Castillo' },
  { email: 'maria.hidalgo@mrgr.edu.pe', password: 'hidalgo536*', first_name: 'Maria Berenice', last_name: 'Hidalgo Bermeo' },
  { email: 'jose.humbo@mrgr.edu.pe', password: 'humbo248*', first_name: 'Jose Elias', last_name: 'Humbo Cordova' },
  { email: 'cristian.lopez@mrgr.edu.pe', password: 'lopez764*', first_name: 'Cristian Alexander', last_name: 'Lopez Choquehuanca' },
  { email: 'sahiron.marchena@mrgr.edu.pe', password: 'marchena391*', first_name: 'Sahiron Alexander', last_name: 'Marchena Peña' },
  { email: 'alisson.araujo@mrgr.edu.pe', password: 'araujo627*', first_name: 'Alisson Sarai', last_name: 'Araujo Cepeda' },
  { email: 'carmen.benites@mrgr.edu.pe', password: 'benites853*', first_name: 'Carmen Alessandra', last_name: 'Benites Chumacero' },
  { email: 'jose.calle@mrgr.edu.pe', password: 'calle416*', first_name: 'Jose Exequiel', last_name: 'Calle Cordova' },
  { email: 'segundo.dominguez@mrgr.edu.pe', password: 'dominguez578*', first_name: 'Segundo Orlando', last_name: 'Dominguez Calle' },
  { email: 'leydi.dominguez@mrgr.edu.pe', password: 'dominguez932*', first_name: 'Leydi', last_name: 'Dominguez Choquehuanca' },
  { email: 'carmen.dominguez@mrgr.edu.pe', password: 'dominguez267*', first_name: 'Carmen Valeria', last_name: 'Dominguez Chumacero' },
  { email: 'cleotilde.garcia@mrgr.edu.pe', password: 'garcia745*', first_name: 'Cleotilde Amelia', last_name: 'Garcia Cordova' },
  { email: 'victor.lopez@mrgr.edu.pe', password: 'lopez319*', first_name: 'Victor Daniel', last_name: 'Lopez Arevalo' },
  { email: 'deyber.lopez@mrgr.edu.pe', password: 'lopez682*', first_name: 'Deyber Jesus', last_name: 'Lopez Chumacero' },
  { email: 'hellen.lopez@mrgr.edu.pe', password: 'lopez954*', first_name: 'Hellen Dayana', last_name: 'Lopez Jimenez' },
  { email: 'olmer.lopez@mrgr.edu.pe', password: 'lopez573*', first_name: 'Olmer Ivan', last_name: 'Lopez Lopez' },
  { email: 'leydi.lopez@mrgr.edu.pe', password: 'lopez821*', first_name: 'Leydi Maricielo', last_name: 'Lopez Peña' },
  { email: 'jhoselyn.naanch@mrgr.edu.pe', password: 'naanch346*', first_name: 'Jhoselyn Anahi', last_name: 'Naanch Peña' },
  { email: 'eliseo.paz@mrgr.edu.pe', password: 'paz719*', first_name: 'Eliseo', last_name: 'Paz Velasquez' },
  { email: 'henry.pintado@mrgr.edu.pe', password: 'pintado485*', first_name: 'Henry Paul', last_name: 'Pintado Castillo' },
  { email: 'segundo.pintado@mrgr.edu.pe', password: 'pintado638*', first_name: 'Segundo Isac', last_name: 'Pintado Chumacero' },
  { email: 'nelly.ramirez@mrgr.edu.pe', password: 'ramirez274*', first_name: 'Nelly Yorleny', last_name: 'Ramirez Castillo' },
  { email: 'jorge.rios@mrgr.edu.pe', password: 'rios891*', first_name: 'Jorge', last_name: 'Rios Peña' },
  { email: 'gladys.rivas@mrgr.edu.pe', password: 'rivas352*', first_name: 'Gladys Camila', last_name: 'Rivas Castillo' },
  { email: 'dilcia.rojas@mrgr.edu.pe', password: 'rojas607*', first_name: 'Dilcia', last_name: 'Rojas Guerrero' },
  { email: 'sofia.santamaria@mrgr.edu.pe', password: 'santamaria743*', first_name: 'Sofia Anabel', last_name: 'Santamaria Garcia' },
  { email: 'ronal.aguilar@mrgr.edu.pe', password: 'aguilar526*', first_name: 'Ronal Omar', last_name: 'Aguilar Castillo' },
  { email: 'laura.castillo@mrgr.edu.pe', password: 'castillo814*', first_name: 'Laura Reydelinda', last_name: 'Castillo Jimenez' },
  { email: 'anabel.cordova@mrgr.edu.pe', password: 'cordova397*', first_name: 'Anabel', last_name: 'Cordova Aguilar' },
  { email: 'fabian.cordova@mrgr.edu.pe', password: 'cordova658*', first_name: 'Fabian Smith', last_name: 'Cordova Jimenez' },
  { email: 'luis.cordova@mrgr.edu.pe', password: 'cordova243*', first_name: 'Luis Daniel', last_name: 'Cordova Lopez' },
  { email: 'henry.dominguez@mrgr.edu.pe', password: 'dominguez875*', first_name: 'Henry', last_name: 'Dominguez Cordova' },
  { email: 'anthony.garcia@mrgr.edu.pe', password: 'garcia461*', first_name: 'Anthony Rusbell', last_name: 'Garcia Armijos' },
  { email: 'calixta.garcia@mrgr.edu.pe', password: 'garcia792*', first_name: 'Calixta Milagros', last_name: 'Garcia Pedemonte' },
  { email: 'juan.humbo@mrgr.edu.pe', password: 'humbo538*', first_name: 'Juan Ricardo', last_name: 'Humbo Cordova' },
  { email: 'luisa.jimenez@mrgr.edu.pe', password: 'jimenez604*', first_name: 'Luisa Fernanda', last_name: 'Jimenez Cordova' },
  { email: 'kenyi.lopez@mrgr.edu.pe', password: 'lopez936*', first_name: 'Kenyi Joel', last_name: 'Lopez Aguilar' },
  { email: 'melissa.lopez@mrgr.edu.pe', password: 'lopez471*', first_name: 'Melissa Elizabeth', last_name: 'Lopez Arevalo' },
  { email: 'cleyder.lopez@mrgr.edu.pe', password: 'lopez725*', first_name: 'Cleyder', last_name: 'Lopez Cordova' },
  { email: 'yareli.nunez@mrgr.edu.pe', password: 'nunez389*', first_name: 'Yareli Anali', last_name: 'Nuñez Velasquez' },
  { email: 'elmer.rojas@mrgr.edu.pe', password: 'rojas546*', first_name: 'Elmer Jesus', last_name: 'Rojas Rojas' },
  { email: 'aracely.rojas@mrgr.edu.pe', password: 'rojas813*', first_name: 'Aracely', last_name: 'Rojas Rosillo' },
  { email: 'alessandro.lopez@mrgr.edu.pe', password: 'lopez657*', first_name: 'Alessandro', last_name: 'Lopez Jimenez' },
  { email: 'nelson.jimenez@mrgr.edu.pe', password: 'jimenez482*', first_name: 'Nelson', last_name: 'Jimenez Lopez' }
]

export async function GET() {
  const results = []

  for (const st of students) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: st.email,
      password: st.password,
      email_confirm: true,
      user_metadata: {
        first_name: st.first_name,
        last_name: st.last_name,
        role: 'student'
      }
    })

    if (error) {
      results.push({ email: st.email, status: 'error', message: error.message })
    } else if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        email: st.email,
        first_name: st.first_name,
        last_name: st.last_name,
        role: 'student'
      })
      results.push({ email: st.email, status: 'ok', id: data.user.id })
    }
  }

  return NextResponse.json({
    message: 'Proceso de registro finalizado',
    total_procesados: results.length,
    detalles: results
  })
}
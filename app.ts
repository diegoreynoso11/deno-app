import { Hono } from 'https://deno.land/x/hono@v3.11.7/mod.ts'
import { serveStatic } from 'https://deno.land/x/hono@v3.11.7/middleware.ts'
import { streamSSE } from 'https://deno.land/x/hono@v3.11.7/helper/streaming/index.ts'
const db = await Deno.openKv()
const app = new Hono()
let i = 0
app.get('/', serveStatic({ path: '/index.html' }))

//! post para suscribirse a un evento que en este caso el mismo hace que cuando entre alguien a la pagina el contador cambie count => count + 1
app.post('/counter', async (c) => {
  //incrementar las visitas en 1
  await db.atomic().sum(['visits'], 1n).commit()
  //enviar respuesta
  return c.json({ message: 'ok' })
})

app.post('/visit', async (c) => {
  const { country, city, flag } = await c.req.json()
  //incrementar las visitas en 1
  await db
    .atomic()
    .set(['LastVisit'], {
      country,
      city,
      flag,
    })
    .sum(['visits'], 1n)
    .commit()
  //enviar respuesta
  return c.json({ message: 'ok' })
})
//! get para mostar los elementos al momento en el que cambian
// Definimos una ruta '/counter' en nuestra aplicación

app.get('/visit', (c) => {
  // Utilizamos la función 'streamSSE' para manejar la respuesta del servidor
  return streamSSE(c, async (stream) => {
    // Creamos un 'watcher' que observará los cambios en 'visits' en nuestra base de datos
    // El observable debe pasarse en un array de arrays para verificar todos los eventos que esten creados
    const watcher = db.watch([['LastVisit']])
    // Iteramos sobre cada entrada del 'watcher'
    for await (const entry of watcher) {
      // Obtenemos el valor de la primera entrada
      // ? se le pasa el valor [0] porque es el primer evento creado
      const { value } = entry[0]
      // Si el valor no es nulo, escribimos el valor en el stream del servidor
      if (value !== null) {
        // Enviamos un evento SSE con el valor actualizado, el evento se llama 'update' y tiene un id único
        await stream.writeSSE({
          data: JSON.stringify(value),
          event: 'update',
          id: String(i++),
        })
      }
    }
  })
})

// app.get('/counter', (c) => {
//   // Utilizamos la función 'streamSSE' para manejar la respuesta del servidor
//   return streamSSE(c, async (stream) => {
//     // Creamos un 'watcher' que observará los cambios en 'visits' en nuestra base de datos
//     // El observable debe pasarse en un array de arrays para verificar todos los eventos que esten creados
//     const watcher = db.watch([['visits']])
//     // Iteramos sobre cada entrada del 'watcher'
//     for await (const entry of watcher) {
//       // Obtenemos el valor de la primera entrada
//       // ? se le pasa el valor [0] porque es el primer evento creado
//       const { value } = entry[0]
//       // Si el valor no es nulo, escribimos el valor en el stream del servidor
//       if (value !== null) {
//         // Enviamos un evento SSE con el valor actualizado, el evento se llama 'update' y tiene un id único
//         await stream.writeSSE({
//           data: value.toString(),
//           event: 'update',
//           id: String(i++),
//         })
//       }
//     }
//   })
// })

// while (true) {
//   const message = new Date().toLocaleTimeString()
//   await stream.writeSSE({data : message, event: 'update', id : String(i++)})
//   await stream.sleep(1000)
// }

Deno.serve(app.fetch)

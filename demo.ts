const db = await Deno.openKv()

//* funcion para crear un dato en la base de datos
// const hola = await db.set(["keyValue"], "value")
// const result = await db.get(["keyValue"])


// * funcion para aumentar las visitas en 1 cada vez que se inicia 
// await db.set(["visits"], new Deno.KvU64(0n)

// ! atomic sirve para evitar que dos usuarios realicen la misma accion al mismo tiempo
//! sum suma 1
//! el commit hace que se setee en la base de datos el resultado
// await db
//     .atomic()
//     .sum(["visits"], 1n)
//     .commit()

// const result = await db.get<number>(["visits"]) 

// console.log(result)
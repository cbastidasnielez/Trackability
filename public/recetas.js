/**
 * Las recetas de /recetas. Para añadir una, copia un objeto y cambia los datos.
 *
 * Los macros se apuntan por ingrediente, para la receta entera tal cual
 * (las `raciones` de la receta), y la página los suma, los divide por ración
 * y los escala si cambias el número de raciones. Valores de referencia de la
 * base de datos USDA (FoodData Central), redondeados.
 *
 * Ingrediente:
 *   cant / ud     cantidad en la unidad de cocina: 'g', 'ml', 'ud', 'cda',
 *                 'cdta', 'diente', 'taza' (sin cant: "al gusto")
 *   met           [cantidad, 'g' | 'ml'] su equivalente métrico, si ud no lo es
 *   n / pl        nombre en singular y en plural (pl solo si cambia)
 *   nota          aclaración corta ("en rodajas", "dividida")
 *   m             { kcal, p, c, g, f } macros de esa cantidad: proteína,
 *                 carbohidratos, grasa y fibra, en gramos
 */

window.RECETAS = [
  {
    id: 'pollo-ajo-calabacin-maiz',
    titulo: 'Pollo al ajo y mantequilla con calabacín y maíz',
    resumen: 'Tiras de pechuga doradas con ajo, pimentón ahumado y lima, con calabacín y maíz en la misma sartén.',
    emoji: '🍗',
    fuente: { nombre: "Julia's Album", url: 'https://juliasalbum.com/chicken-with-zucchini-and-corn/' },
    tiempo: { prep: 15, coccion: 15 },
    raciones: 4,
    etiquetas: ['Cena', 'Rápida', 'Alta en proteína', 'Una sartén'],
    ingredientes: [
      { cant: 4, ud: 'cda', met: [54, 'ml'], n: 'aceite de oliva', nota: 'mitad para el calabacín, mitad para el pollo',
        m: { kcal: 477, p: 0, c: 0, g: 54, f: 0 } },
      { cant: 2, ud: 'ud', met: [400, 'g'], n: 'calabacín mediano', pl: 'calabacines medianos', nota: 'en rodajas',
        m: { kcal: 68, p: 4.8, c: 12.4, g: 1.2, f: 4 } },
      { cant: 1.5, ud: 'taza', met: [225, 'g'], n: 'maíz dulce cocido', nota: 'desgranado (o de lata, escurrido)',
        m: { kcal: 216, p: 7.7, c: 47, g: 3.4, f: 5.4 } },
      { cant: 450, ud: 'g', n: 'pechuga de pollo sin piel ni hueso', nota: 'en tiras',
        m: { kcal: 545, p: 102, c: 0, g: 11.8, f: 0 } },
      { cant: 0.5, ud: 'cdta', n: 'pimentón ahumado',
        m: { kcal: 3, p: 0.1, c: 0.5, g: 0.1, f: 0.3 } },
      { cant: 0.5, ud: 'cdta', n: 'chile en polvo',
        m: { kcal: 4, p: 0.2, c: 0.7, g: 0.2, f: 0.4 } },
      { cant: 0.25, ud: 'cdta', n: 'sal', nota: 'y más al gusto',
        m: { kcal: 0, p: 0, c: 0, g: 0, f: 0 } },
      { n: 'pimienta negra recién molida', nota: 'al gusto',
        m: { kcal: 0, p: 0, c: 0, g: 0, f: 0 } },
      { cant: 5, ud: 'diente', met: [15, 'g'], n: 'ajo', nota: 'picado',
        m: { kcal: 22, p: 1, c: 5, g: 0.1, f: 0.3 } },
      { cant: 2, ud: 'cda', met: [30, 'ml'], n: 'jugo de lima', nota: 'o de limón verde, recién exprimido',
        m: { kcal: 8, p: 0.1, c: 2.5, g: 0, f: 0 } },
      { cant: 4, ud: 'cda', met: [56, 'g'], n: 'mantequilla', nota: 'mitad para el pollo, mitad para el final',
        m: { kcal: 401, p: 0.5, c: 0, g: 45.4, f: 0 } },
      { cant: 0.5, ud: 'taza', met: [8, 'g'], n: 'cilantro fresco', nota: 'picado',
        m: { kcal: 2, p: 0.2, c: 0.3, g: 0, f: 0.2 } }
    ],
    pasos: [
      { seccion: 'Las verduras', items: [
        'Calienta una sartén grande y honda (mejor si es de hierro) a fuego medio durante 1 minuto. Añade la mitad del aceite y el calabacín, con una pizca de sal y pimienta. Cocina unos 3 minutos, dándole la vuelta una vez, y sácalo a un plato.'
      ] },
      { seccion: 'El pollo al ajo', items: [
        'Corta las pechugas en tiras y sazónalas con el pimentón ahumado, el chile en polvo, la sal y pimienta negra.',
        'En la misma sartén, ya vacía, calienta el resto del aceite a fuego medio. Pon el pollo en una sola capa y déjalo unos 4 minutos sin tocarlo.',
        'Dale la vuelta a las tiras, añade el ajo y cocina 2 minutos más. Baja el fuego, añade el jugo de lima y la mitad de la mantequilla, y cocina otros 2 minutos removiendo a menudo, hasta que el pollo esté hecho (sin pasarse) y el ajo se ablande.'
      ] },
      { seccion: 'Juntarlo todo', items: [
        'Añade a la sartén el calabacín y el maíz cocido.',
        'Añade el resto de la mantequilla y deja que se derrita a fuego bajo, removiendo un par de minutos, hasta que la salsa cubra el pollo y las verduras. Retira del fuego.',
        'Mezcla la mitad del cilantro. Prueba y ajusta de sal, pimentón, chile o lima.',
        'Al servir, reparte por encima el resto del cilantro y, si quieres, una pizca de chile en polvo.'
      ] }
    ],
    notas: [
      'Versión más ligera: usa la mitad de mantequilla y baja a unas 385 kcal por ración.',
      'La web original da 421 kcal por ración; aquí salen unas 435 porque se calcula ingrediente por ingrediente. La diferencia es normal.'
    ]
  }
];

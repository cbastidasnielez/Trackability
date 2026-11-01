/**
 * Las recetas de /recetas. Para añadir una, copia un objeto y cambia los datos.
 *
 * Comunes a todas:
 *   id, titulo, emoji, resumen (opcional)
 *   momento       ['desayuno' | 'almuerzo' | 'cena' | 'pre']: los filtros de la lista
 *   tiempo        { prep, coccion } en minutos, o solo { total }
 *   raciones      para cuántas son las cantidades escritas
 *   etiquetas     ['Rápida', 'Airfryer'…]: se ven en la receta y entran en el buscador
 *   pasos         lista de textos, o [{ seccion, items: [...] }] si van por partes
 *   truco, notas  opcionales; fuente: { nombre, url } si viene de una web
 *
 * Los macros se apuntan de una de dos maneras:
 *   1. Por ingrediente (la más precisa): cada ingrediente lleva `m` con los
 *      macros de esa cantidad, y la página los suma y los divide por ración.
 *      Valores de referencia de la base de datos USDA (FoodData Central).
 *   2. Ya calculados: `macros: { kcal, p, c, g }` por ración (así vienen las
 *      del recetario de Carlos, con valores de BEDCA y etiquetas).
 *
 * Ingrediente, como objeto (se escala bien con las raciones):
 *   cant / ud     cantidad en la unidad de cocina: 'g', 'ml', 'ud', 'cda',
 *                 'cdta', 'diente', 'taza' (sin cant: "al gusto")
 *   met           [cantidad, 'g' | 'ml'] su equivalente métrico, si ud no lo es
 *   n / pl        nombre en singular y en plural (pl solo si cambia)
 *   nota          aclaración corta ("en rodajas", "dividida")
 *   m             { kcal, p, c, g, f } macros de esa cantidad: proteína,
 *                 carbohidratos, grasa y fibra, en gramos
 * o como texto ('150 g de yogur griego 0 %'): al cambiar las raciones se
 * escalan los números con g, ml o kg y los dientes, limas, yemas y huevos.
 */

window.RECETAS = [
  {
    id: 'pollo-ajo-calabacin-maiz',
    titulo: 'Pollo al ajo y mantequilla con calabacín y maíz',
    resumen: 'Tiras de pechuga doradas con ajo, pimentón ahumado y lima, con calabacín y maíz en la misma sartén.',
    emoji: '🍗',
    fuente: { nombre: "Julia's Album", url: 'https://juliasalbum.com/chicken-with-zucchini-and-corn/' },
    tiempo: { prep: 15, coccion: 15 },
    momento: ['cena', 'almuerzo'],
    raciones: 4,
    etiquetas: ['Rápida', 'Alta en proteína', 'Una sartén'],
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
  },

  // ——— Del recetario de Carlos (tracking_finance): macros ya calculados por ración ———
  {
    id: 'avena-arandanos',
    titulo: 'Avena proteica con arándanos',
    emoji: '🫐',
    momento: ['desayuno'],
    tiempo: {total: 5},
    raciones: 1,
    etiquetas: ['Sin cocinar'],
    ingredientes: [
      '50 g de avena',
      {cant: 1, ud: 'ud', n: 'scoop de whey de vainilla', pl: 'scoops de whey de vainilla', met: [30, 'g']},
      '150 g de yogur griego 0 %',
      '100 g de arándanos'
    ],
    pasos: [
      'Mezcla la avena con el whey en seco para que no queden grumos.',
      'Añade el yogur y 50–80 ml de agua o leche hasta que quede cremoso.',
      'Arándanos por encima. Puedes dejarlo hecho la noche antes en un bote (overnight oats).'
    ],
    macros: {kcal: 450, p: 43, c: 53, g: 6},
    truco: 'Aplasta la mitad de los arándanos con un tenedor antes de mezclar: tiñen la avena y endulzan todo el bote sin miel.'
  },
  {
    id: 'bowl-yogur-fresas',
    titulo: 'Bowl de yogur con fresas',
    emoji: '🍓',
    momento: ['desayuno', 'pre'],
    tiempo: {total: 5},
    raciones: 1,
    etiquetas: ['Sin cocinar'],
    ingredientes: [
      '300 g de yogur griego 0 %',
      '100 g de fresas',
      '30 g de granola',
      '15 g de crema de cacahuete'
    ],
    pasos: [
      'Yogur de base en un bol.',
      'Fresas en cuartos por encima.',
      'Granola justo al servir para que cruja y la crema de cacahuete en hilo.'
    ],
    macros: {kcal: 425, p: 38, c: 41, g: 13},
    truco: 'Templa la crema de cacahuete 10 s en el microondas: cae en hilo fino y con 15 g cubres todo el bol.'
  },
  {
    id: 'bowl-pollo-arroz',
    titulo: 'Bowl de pollo con arroz y brócoli',
    emoji: '🍗',
    momento: ['almuerzo', 'cena'],
    tiempo: {total: 20},
    raciones: 1,
    etiquetas: ['Meal prep'],
    ingredientes: [
      '150 g de pechuga de pollo cocinada',
      '150 g de arroz cocido (≈ 50 g en seco)',
      '100 g de brócoli',
      '10 g de aceite de oliva',
      'Sal, pimienta, pimentón y limón'
    ],
    pasos: [
      'Brócoli al vapor o en el microondas con un poco de agua, 3–4 min: que quede verde y firme.',
      'Pollo a la plancha bien caliente, 4–5 min por lado, con sal y pimentón.',
      'Monta el bowl con el arroz, el pollo en tiras y el brócoli. El aceite en crudo por encima, con limón.'
    ],
    macros: {kcal: 570, p: 54, c: 49, g: 16},
    truco: 'Deja reposar el pollo 3 min antes de cortarlo: no pierde jugo y no queda seco aunque lo comas frío del táper.'
  },
  {
    id: 'pita-pollo',
    titulo: 'Pita integral de pollo',
    emoji: '🥙',
    momento: ['almuerzo', 'cena'],
    tiempo: {total: 10},
    raciones: 1,
    etiquetas: ['Rápida'],
    ingredientes: [
      {cant: 1, ud: 'ud', n: 'pan de pita integral', pl: 'panes de pita integrales'},
      '120 g de pechuga de pollo cocinada',
      '20 g de mayonesa light',
      'Lechuga',
      'Pepino'
    ],
    pasos: [
      'Tuesta la pita 1 min por lado en la sartén o la tostadora y ábrela.',
      'Unta la mayonesa por dentro.',
      'Rellena con lechuga, pepino en bastones y el pollo en tiras.'
    ],
    macros: {kcal: 420, p: 45, c: 34, g: 11},
    truco: 'Mezcla la mayonesa con jugo de limón y una pizca de comino: sabe a salsa de kebab sin una caloría más.'
  },
  {
    id: 'ternera-patatas',
    titulo: 'Ternera magra con patatas y judías',
    emoji: '🥩',
    momento: ['almuerzo', 'cena'],
    tiempo: {total: 30},
    raciones: 1,
    etiquetas: ['Airfryer'],
    ingredientes: [
      '150 g de carne picada de ternera 5 %',
      '250 g de patata',
      '100 g de judías verdes',
      '5 g de aceite de oliva',
      'Sal, pimienta, ajo en polvo y pimentón'
    ],
    pasos: [
      'Patata en dados con la mitad del aceite y pimentón: airfryer a 200 °C 18–20 min, sacudiendo a mitad.',
      'Judías verdes hervidas 6–7 min o al vapor.',
      'Carne a la sartén muy caliente con el resto del aceite, sin removerla los primeros 2 min para que se dore. Sal, pimienta y ajo.',
      'Todo junto en el plato.'
    ],
    macros: {kcal: 455, p: 37, c: 48, g: 13},
    truco: 'No sales la carne hasta que esté dorada: la sal saca el agua antes de tiempo y la carne se cuece en vez de tostarse.'
  },
  {
    id: 'tortitas-arroz-pre',
    titulo: 'Tortitas de arroz pre-entreno',
    emoji: '🍌',
    momento: ['pre'],
    tiempo: {total: 3},
    raciones: 1,
    etiquetas: ['Sin cocinar', 'Rápida'],
    ingredientes: [
      {cant: 4, ud: 'ud', n: 'tortita de arroz', pl: 'tortitas de arroz'},
      {cant: 1, ud: 'ud', n: 'plátano mediano', pl: 'plátanos medianos'},
      '15 g de miel'
    ],
    pasos: [
      'Plátano en rodajas sobre las tortitas.',
      'Miel por encima. Cómelo 30–60 min antes de entrenar.'
    ],
    macros: {kcal: 330, p: 4, c: 75, g: 1},
    truco: 'Una pizca de sal y canela por encima: el sodio ayuda en los WODs largos y la canela hace que sepa a postre.',
    notas: ['Casi sin proteína a propósito: es carbo rápido para entrenar. Si es merienda, añade un yogur o un batido de proteína.']
  },
  {
    id: 'camarones-golden-crunch',
    titulo: 'Camarones Golden Crunch con dip de yogur y sriracha',
    emoji: '🍤',
    momento: ['cena'],
    tiempo: {total: 20},
    raciones: 1,
    etiquetas: ['Airfryer', 'Definición'],
    ingredientes: [
      '200 g de camarón pelado crudo',
      {cant: 1, ud: 'ud', n: 'clara de huevo', pl: 'claras de huevo'},
      '25 g de panko',
      '3 g de pimentón de la Vera',
      '2 g de ajo en polvo',
      '2 g de sal',
      'Ralladura de limón',
      'Spray de aceite (5 ml)',
      'Dip: 100 g de yogur griego 0 % y 5 g de sriracha'
    ],
    pasos: [
      'Seca los camarones a fondo con papel. Si quedan húmedos, el empanado no se pega y no cruje.',
      'Mezcla el panko con el pimentón, el ajo, la sal y la ralladura de limón.',
      'Pasa cada camarón por la clara batida y luego por el panko, presionando bien.',
      'Airfryer precalentada a 200 °C: una sola capa, spray de aceite y 7–8 min, girándolos a mitad.',
      'Mezcla el yogur con la sriracha y una pizca de sal.'
    ],
    macros: {kcal: 390, p: 57, c: 25, g: 8},
    truco: 'Tuesta el panko en seco en una sartén 2 min antes de empanar: dorado de fritura con solo 5 ml de aceite.'
  },
  {
    id: 'wok-imperial',
    titulo: 'Wok Imperial de camarones, ajo, jengibre y sésamo',
    emoji: '🥢',
    momento: ['cena', 'almuerzo'],
    tiempo: {total: 25},
    raciones: 1,
    etiquetas: ['Post-entreno'],
    ingredientes: [
      '200 g de camarón pelado crudo',
      '60 g de arroz jazmín o vaporizado (en seco)',
      '150 g de brócoli en floretes',
      '100 g de pimiento rojo',
      {cant: 2, ud: 'diente', met: [8, 'g'], n: 'ajo'},
      '5 g de jengibre fresco',
      '10 ml de aceite de sésamo',
      '15 ml de salsa de soja baja en sodio',
      '10 g de cebollino',
      '1 g de guindilla en copos'
    ],
    pasos: [
      'Cocina el arroz. Escalda el brócoli 1 min y pásalo a agua con hielo para que quede verde y crujiente.',
      'Wok muy caliente, hasta que humee. Mitad del aceite y sella los camarones 60 s por lado. Retíralos.',
      'Saltea el ajo y el jengibre 20 s, luego el pimiento y el brócoli 2 min a fuego máximo.',
      'Devuelve los camarones, añade la soja y el resto del aceite fuera del fuego. Cebollino y guindilla al final.'
    ],
    macros: {kcal: 565, p: 50, c: 64, g: 13},
    truco: 'Velveting ligero: marina los camarones 10 min con 4 g de maicena y 1 g de bicarbonato. Quedan jugosos, como en un restaurante.'
  },
  {
    id: 'bowl-texmex',
    titulo: 'Bowl Tex-Mex de camarones cilantro-lima',
    emoji: '🌮',
    momento: ['cena', 'almuerzo'],
    tiempo: {total: 25},
    raciones: 1,
    etiquetas: ['Meal prep'],
    ingredientes: [
      '200 g de camarón pelado crudo',
      '5 ml de aceite de oliva',
      '2 g de comino',
      '2 g de chipotle en polvo (o pimentón picante)',
      {cant: 1, ud: 'diente', n: 'ajo'},
      {cant: 1, ud: 'ud', n: 'lima', pl: 'limas'},
      '80 g de alubias negras cocidas',
      '60 g de maíz',
      '50 g de aguacate',
      '100 g de pico de gallo (tomate, cebolla, cilantro y lima)',
      'Lechuga romana'
    ],
    pasos: [
      'Marina los camarones 15 min con el aceite, el comino, el chipotle, el ajo picado y la ralladura y el jugo de media lima.',
      'Plancha muy caliente, 90 s por lado, hasta que formen una «C». Si se cierran en «O», se pasaron.',
      'Tatema el maíz en la misma plancha 3 min.',
      'Monta: lechuga, alubias, maíz, pico de gallo, aguacate en láminas y camarones. Lima y cilantro al final.'
    ],
    macros: {kcal: 475, p: 51, c: 39, g: 15},
    truco: 'Dora las cáscaras de los camarones y hiérvelas 20 min: caldo de 0 kcal para cocer arroz con sabor a mar.',
    notas: ['Sin legumbres: cambia las alubias por 50 g de arroz en seco y los macros quedan casi iguales.']
  },
  {
    id: 'aguachile-verde',
    titulo: 'Aguachile verde de camarones',
    emoji: '🥒',
    momento: ['cena'],
    tiempo: {total: 20},
    raciones: 1,
    etiquetas: ['Sin cocinar', 'Definición'],
    ingredientes: [
      '200 g de camarón pelado crudo',
      '120 ml de jugo de lima',
      {cant: 1, ud: 'ud', n: 'chile serrano o jalapeño', pl: 'chiles serranos o jalapeños', nota: 'o guindilla verde, en la misma cantidad'},
      '15 g de cilantro',
      '100 g de pepino',
      '30 g de cebolla morada en pluma',
      '30 g de aguacate',
      '2 g de sal',
      {cant: 2, ud: 'ud', n: 'tostada de maíz horneada', pl: 'tostadas de maíz horneadas', met: [30, 'g']}
    ],
    pasos: [
      'Abre los camarones en mariposa y colócalos en un plato frío.',
      'Tritura el jugo de lima, el chile, el cilantro, 30 g del pepino y la sal.',
      'Vierte la salsa sobre los camarones y deja 10–15 min en la nevera, hasta que se vuelvan rosados y opacos.',
      'Pepino en medias lunas, cebolla y aguacate por encima. Con las tostadas.'
    ],
    macros: {kcal: 355, p: 44, c: 31, g: 8},
    truco: 'La lima cambia la textura pero no mata bacterias: usa camarón congelado de buena procedencia o escáldalo 30 s y enfríalo en hielo antes.'
  },
  {
    id: 'gambas-ajillo-calabacin',
    titulo: 'Gambas al ajillo con espaguetis de calabacín',
    emoji: '🦐',
    momento: ['cena'],
    tiempo: {total: 15},
    raciones: 1,
    etiquetas: ['Rápida', 'Bajo en carbo'],
    ingredientes: [
      '250 g de gambas peladas',
      '10 ml de aceite de oliva',
      {cant: 3, ud: 'diente', n: 'ajo'},
      {cant: 1, ud: 'ud', n: 'guindilla', pl: 'guindillas'},
      '250 g de calabacín espiralizado',
      'Perejil y limón'
    ],
    pasos: [
      'Dora el ajo laminado y la guindilla a fuego bajo 2 min.',
      'Sube el fuego y sella las gambas 60 s por lado.',
      'Saltea el calabacín 90 s, no más, para que no suelte agua.',
      'Termina con limón y perejil.'
    ],
    macros: {kcal: 345, p: 53, c: 8, g: 13},
    truco: 'Sala el calabacín 10 min antes y sécalo con papel: queda al dente, como pasta de verdad.',
    notas: ['Ligera: pensada para días de poco gasto. Con 300 g de gambas: ~390 kcal y 63 g de proteína.']
  },
  {
    id: 'pasta-gambas-trigueros',
    titulo: 'Pasta con gambas al ajillo y trigueros',
    emoji: '🍝',
    momento: ['cena', 'almuerzo'],
    tiempo: {total: 20},
    raciones: 1,
    etiquetas: ['Post-entreno', 'Recarga'],
    ingredientes: [
      '300 g de gambas peladas',
      '90 g de pasta (en seco)',
      '15 ml de aceite de oliva',
      {cant: 3, ud: 'diente', n: 'ajo'},
      {cant: 1, ud: 'ud', n: 'guindilla', pl: 'guindillas'},
      '150 g de espárragos trigueros',
      '20 g de parmesano',
      'Limón y perejil'
    ],
    pasos: [
      'Cuece la pasta 1 min menos de lo que pone el paquete y guarda 100 ml del agua de cocción.',
      'Dora el ajo a fuego bajo, añade los trigueros en trozos de 3 cm y saltéalos 3 min.',
      'Sella las gambas 60 s por lado.',
      'Termina la pasta en la sartén con el agua reservada hasta que espese. Fuera del fuego, parmesano y limón.'
    ],
    macros: {kcal: 830, p: 81, c: 70, g: 26},
    truco: 'El almidón del agua de cocción emulsiona el aceite y hace una salsa cremosa sin nata.',
    notas: ['Trigueros = espárragos verdes finos. Si no hay, brócoli, calabacín o judías verdes en la misma cantidad.']
  },
  {
    id: 'salmon-teriyaki',
    titulo: 'Salmón teriyaki con arroz basmati y verduras',
    emoji: '🐟',
    momento: ['cena', 'almuerzo'],
    tiempo: {total: 25},
    raciones: 1,
    etiquetas: ['Pescado azul'],
    ingredientes: [
      '150 g de salmón fresco',
      '80 g de arroz basmati (en seco)',
      '200 g de verduras (pimiento, cebolla, zanahoria, calabacín)',
      '45 ml de salsa teriyaki',
      '15 ml de salsa de soja',
      '5 g de miel',
      {cant: 1, ud: 'diente', n: 'ajo', nota: 'rallado'},
      {n: 'jengibre', nota: 'una pizca'},
      '5 ml de aceite',
      'Sésamo o cilantro'
    ],
    pasos: [
      'Arroz primero: enjuágalo, 1 parte de arroz por 1,5 de agua con sal, tapado a fuego mínimo 12 min y 5 min de reposo.',
      'Seca el salmón con papel y sálalo. Sartén muy caliente con un hilo de aceite, 3 min por lado (piel primero).',
      'Baja el fuego y añade la teriyaki, la soja, la miel, el ajo y el jengibre. Deja que borbotee 1–2 min regando el salmón con la salsa hasta que glasee.',
      'Verduras en tiras finas al wok a fuego fuerte 3–4 min, crujientes, con un toque de soja.',
      'Arroz de base, salmón con su salsa encima y verduras al lado. Sésamo por encima.'
    ],
    macros: {kcal: 780, p: 41, c: 93, g: 26},
    truco: 'La salsa va al final y con el fuego bajo: la miel y el azúcar de la teriyaki se queman en segundos a fuego fuerte.'
  },
  {
    id: 'bowl-salmon-mango',
    titulo: 'Bowl de salmón y mango con vinagreta asiática',
    emoji: '🥭',
    momento: ['cena', 'almuerzo'],
    tiempo: {total: 25},
    raciones: 1,
    etiquetas: ['Pescado azul', 'Meal prep'],
    ingredientes: [
      '150 g de salmón fresco',
      '70 g de arroz basmati o integral (en seco)',
      '80 g de mango maduro',
      '50 g de aguacate',
      '60 g de edamame',
      '80 g de pepino',
      '50 g de zanahoria rallada',
      'Vinagreta: 15 ml de soja baja en sodio, 5 ml de aceite de sésamo, jugo de ½ lima, 5 g de miel y 3 g de jengibre rallado',
      '5 g de sésamo'
    ],
    pasos: [
      'Cuece el arroz y déjalo templar.',
      'Salmón a la plancha 3 min por lado, o en dados crudo si estaba congelado 48 h antes.',
      'Bate la vinagreta.',
      'Monta el bowl por zonas: arroz, salmón, mango y aguacate en dados, edamame, pepino y zanahoria. Vinagreta y sésamo al servir.'
    ],
    macros: {kcal: 890, p: 46, c: 90, g: 39},
    truco: 'Marina el salmón 5 min en la mitad de la vinagreta antes de cocinarlo: el sabor entra y la otra mitad aliña el bowl.',
    notas: ['Revisa las cantidades la primera vez que la hagas.']
  },
  {
    id: 'pasta-pesto-aguacate-salmon',
    titulo: 'Pasta con pesto de aguacate y salmón',
    emoji: '🥑',
    momento: ['almuerzo', 'cena'],
    tiempo: {total: 25},
    raciones: 1,
    etiquetas: ['Pescado azul', 'Post-entreno'],
    ingredientes: [
      '90 g de pasta (en seco)',
      '150 g de salmón fresco',
      'Pesto: 70 g de aguacate maduro, 10 g de albahaca, ½ diente de ajo, 10 ml de jugo de limón, 10 g de piñones, 10 g de parmesano y 5 ml de aceite de oliva',
      '40 ml del agua de cocción',
      'Ralladura de limón (o de lima con un poco de jengibre)'
    ],
    pasos: [
      'Cuece la pasta y guarda un poco del agua de cocción.',
      'Tritura todo el pesto y aligéralo con el agua de cocción hasta que quede cremoso.',
      'Salmón a la plancha 3 min por lado y desmígalo en lascas.',
      'Mezcla la pasta con el pesto fuera del fuego (el aguacate no se cocina) y el salmón por encima con ralladura.'
    ],
    macros: {kcal: 900, p: 48, c: 74, g: 47},
    truco: 'Para un toque distinto, cambia el limón por lima y añade 3 g de jengibre al pesto: le da un aire caribeño.',
    notas: ['Revisa las cantidades la primera vez que la hagas.']
  },
  {
    id: 'pancakes-huevos-tocino',
    titulo: 'Pancakes con huevos y tocino',
    emoji: '🥞',
    momento: ['desayuno'],
    tiempo: {total: 30},
    raciones: 2,
    etiquetas: ['Capricho', 'Brunch'],
    ingredientes: [
      '45 g de yogur o nata',
      '30 g de mantequilla derretida',
      {cant: 1, ud: 'ud', n: 'huevo', pl: 'huevos'},
      {cant: 1, ud: 'ud', n: 'yema de huevo', pl: 'yemas de huevo'},
      '135 ml de leche',
      '150 g de harina tamizada',
      '45 g de azúcar',
      '15 g de levadura química',
      {cant: 4, ud: 'ud', n: 'huevo', pl: 'huevos', nota: 'para acompañar, 2 por persona'},
      {cant: 6, ud: 'ud', n: 'loncha de tocino', pl: 'lonchas de tocino', met: [90, 'g'], nota: '3 por persona'}
    ],
    pasos: [
      'Arranca el tocino en la sartén en frío y a fuego medio, para que suelte la grasa y quede crujiente.',
      'Mientras, mezcla el yogur, la mantequilla, el huevo y la leche. Añade la harina y el azúcar e integra sin batir de más (algún grumo está bien).',
      'Añade la levadura al final, mezcla suave y deja reposar 5 min.',
      'Sartén a fuego medio-bajo. Vierte la masa desde 10 cm de altura; dale la vuelta cuando salgan burbujas en la superficie.',
      'Termina con los huevos en la grasa del tocino.'
    ],
    macros: {kcal: 880, p: 38, c: 85, g: 42},
    truco: 'Tamiza la harina (o bátela en seco 10 s con varillas): menos grumos, menos batido y pancakes más tiernos.',
    notas: ['La masa da para 6–8 pancakes, 3 o 4 por persona. Por ración: media masa, 2 huevos y 3 lonchas.', 'Es de fin de semana: va mejor en un día de mucho entreno.']
  },
  {
    id: 'noquis-bolonesa',
    titulo: 'Ñoquis a la boloñesa',
    emoji: '🥟',
    momento: ['almuerzo'],
    tiempo: {total: 30},
    raciones: 1,
    etiquetas: ['Meal prep'],
    ingredientes: [
      '300 g de ñoquis frescos',
      '130 g de carne picada de ternera 5 %',
      '200 g de tomate triturado',
      'Cebolla y zanahoria',
      '20 g de parmesano',
      '10 ml de aceite de oliva',
      'Albahaca y orégano'
    ],
    pasos: [
      'Sofríe la cebolla y la zanahoria picadas 8 min.',
      'Dora la carne, añade el tomate y deja 15–20 min a fuego bajo (se puede hacer el domingo).',
      'Ñoquis 2–3 min en agua hirviendo: cuando floten, a la salsa.',
      'Parmesano y albahaca al servir.'
    ],
    macros: {kcal: 860, p: 47, c: 111, g: 24}
  },
  {
    id: 'salmon-horno-patata',
    titulo: 'Salmón al horno con patata y brócoli',
    emoji: '🐟',
    momento: ['almuerzo'],
    tiempo: {total: 40},
    raciones: 1,
    etiquetas: ['Pescado azul', 'Horno'],
    ingredientes: [
      '180 g de salmón fresco',
      '350 g de patata en gajos',
      '200 g de brócoli',
      '15 ml de aceite de oliva',
      'Limón, ajo y pimentón'
    ],
    pasos: [
      'Patata en gajos con aceite de oliva y pimentón a 200 °C 25 min.',
      'Añade el salmón con limón a la bandeja y 12–15 min más.',
      'Brócoli salteado con ajo 5 min.'
    ],
    macros: {kcal: 840, p: 49, c: 68, g: 40}
  },
  {
    id: 'carbonara-fit',
    titulo: 'Pasta carbonara fit',
    emoji: '🍝',
    momento: ['almuerzo'],
    tiempo: {total: 20},
    raciones: 1,
    etiquetas: [],
    ingredientes: [
      '110 g de pasta integral',
      '120 g de bacon de pavo (o taquitos de jamón)',
      {cant: 2, ud: 'ud', n: 'huevo M', pl: 'huevos M'},
      {cant: 1, ud: 'ud', n: 'yema de huevo', pl: 'yemas de huevo'},
      '30 g de parmesano',
      'Pimienta negra'
    ],
    pasos: [
      'Bate los huevos, la yema y el parmesano con mucha pimienta.',
      'Dora el bacon.',
      'Pasa la pasta escurrida a la sartén fuera del fuego, añade la mezcla y un chorro de agua de cocción, y remueve hasta que emulsione. Sin nata.'
    ],
    macros: {kcal: 830, p: 64, c: 70, g: 30},
    truco: 'Fuera del fuego siempre: si la sartén quema, el huevo se cuaja en grumos en vez de hacer crema.'
  },
  {
    id: 'pollo-teriyaki-wok',
    titulo: 'Pollo teriyaki con arroz y verduras al wok',
    emoji: '🍗',
    momento: ['almuerzo'],
    tiempo: {total: 25},
    raciones: 1,
    etiquetas: ['Día duro'],
    ingredientes: [
      '130 g de arroz basmati (en seco)',
      '170 g de pechuga de pollo',
      '200 g de verduras (brócoli, pimiento, zanahoria, cebolleta)',
      '30 ml de salsa teriyaki',
      '10 ml de aceite de sésamo',
      'Sésamo'
    ],
    pasos: [
      'Pollo en dados a fuego fuerte 5–6 min y fuera.',
      'Verduras al wok 4 min.',
      'Vuelve el pollo, añade la teriyaki y 1 min hasta que glasee. Sésamo por encima.'
    ],
    macros: {kcal: 870, p: 52, c: 123, g: 16}
  },
  {
    id: 'noquis-pesto-pollo',
    titulo: 'Ñoquis al pesto con pollo',
    emoji: '🥟',
    momento: ['almuerzo'],
    tiempo: {total: 15},
    raciones: 1,
    etiquetas: ['Rápida'],
    ingredientes: [
      '300 g de ñoquis frescos',
      '160 g de pechuga de pollo a tiras',
      '30 g de pesto genovés',
      '100 g de tomates cherry',
      '20 g de parmesano',
      'Piñones y albahaca'
    ],
    pasos: [
      'Pollo a tiras a la plancha.',
      'Ñoquis cocidos 2–3 min, a la sartén con el pollo y los cherry partidos.',
      'Pesto fuera del fuego. Parmesano y piñones al servir.'
    ],
    macros: {kcal: 960, p: 59, c: 105, g: 32}
  },
  {
    id: 'pasta-pesto-pollo',
    titulo: 'Pasta al pesto con pollo y cherry',
    emoji: '🍝',
    momento: ['almuerzo'],
    tiempo: {total: 20},
    raciones: 1,
    etiquetas: [],
    ingredientes: [
      '120 g de pasta integral',
      '170 g de pechuga de pollo',
      '30 g de pesto',
      '100 g de tomates cherry',
      '20 g de parmesano',
      'Rúcula'
    ],
    pasos: [
      'Cuece la pasta y haz el pollo a la plancha en tiras.',
      'Mezcla con los cherry y el pesto fuera del fuego.',
      'Rúcula en crudo y parmesano al final.'
    ],
    macros: {kcal: 840, p: 64, c: 80, g: 26}
  },
  {
    id: 'pollo-limon-patatas',
    titulo: 'Pollo asado al limón con patatas',
    emoji: '🍋',
    momento: ['almuerzo'],
    tiempo: {total: 50},
    raciones: 1,
    etiquetas: ['Horno', 'Una bandeja'],
    ingredientes: [
      '200 g de pollo',
      '300 g de patata',
      '200 g de verduras (calabacín, pimiento, cebolla)',
      '15 ml de aceite de oliva',
      'Limón, romero y ajo'
    ],
    pasos: [
      'Todo en una bandeja con el aceite de oliva, el limón, el ajo y el romero.',
      '200 °C, 40–45 min, dando la vuelta a mitad.'
    ],
    macros: {kcal: 635, p: 55, c: 60, g: 19}
  },
  {
    id: 'burrito-bowl',
    titulo: 'Burrito bowl de pollo',
    emoji: '🌯',
    momento: ['cena'],
    tiempo: {total: 20},
    raciones: 1,
    etiquetas: [],
    ingredientes: [
      '70 g de arroz basmati (en seco)',
      '150 g de pollo desmenuzado',
      '50 g de maíz',
      '25 g de queso rallado',
      '40 g de guacamole',
      'Tomate, cilantro, lima y comino'
    ],
    pasos: [
      'Pollo cocido o a la plancha, desmenuzado con comino y lima.',
      'Monta el bol: arroz, pollo, maíz, tomate, queso y guacamole.'
    ],
    macros: {kcal: 620, p: 49, c: 67, g: 17}
  },
  {
    id: 'tortilla-patatas-jamon',
    titulo: 'Tortilla de patatas con jamón',
    emoji: '🍳',
    momento: ['cena'],
    tiempo: {total: 25},
    raciones: 1,
    etiquetas: [],
    ingredientes: [
      {cant: 3, ud: 'ud', n: 'huevo M', pl: 'huevos M'},
      '200 g de patata',
      '40 g de cebolla',
      '10 ml de aceite de oliva',
      '40 g de jamón serrano',
      'Ensalada de tomate'
    ],
    pasos: [
      'Patata y cebolla en láminas finas al microondas 6–7 min (o pochadas con poco aceite).',
      'Mezcla con el huevo batido y cuaja 3 min por lado.',
      'Jamón y ensalada al lado.'
    ],
    macros: {kcal: 620, p: 39, c: 44, g: 32}
  },
  {
    id: 'pollo-boniato',
    titulo: 'Pollo asado con boniato',
    emoji: '🍠',
    momento: ['cena', 'almuerzo'],
    tiempo: {total: 30},
    raciones: 1,
    etiquetas: ['Horno', 'Una bandeja'],
    ingredientes: [
      '170 g de pechuga de pollo',
      '250 g de boniato',
      '150 g de pimientos asados',
      '10 ml de aceite de oliva',
      'Pimentón, ajo y tomillo'
    ],
    pasos: [
      'Boniato en cubos a 200 °C 25 min.',
      'El pollo con especias a la misma bandeja los últimos 18–20 min.'
    ],
    macros: {kcal: 535, p: 45, c: 58, g: 13}
  },
  {
    id: 'caballa-cuscus',
    titulo: 'Caballa a la plancha con cuscús',
    emoji: '🐟',
    momento: ['cena'],
    tiempo: {total: 15},
    raciones: 1,
    etiquetas: ['Pescado azul', 'Rápida'],
    ingredientes: [
      '180 g de caballa (o sardinas)',
      '80 g de cuscús (en seco)',
      '150 g de pimientos asados',
      '10 ml de aceite de oliva',
      'Limón y perejil'
    ],
    pasos: [
      'Cuscús con el mismo volumen de agua hirviendo y sal, tapado 5 min.',
      'Caballa a la plancha 3 min por lado, piel primero.'
    ],
    macros: {kcal: 790, p: 45, c: 66, g: 36}
  },
  {
    id: 'hamburguesa-casera',
    titulo: 'Hamburguesa casera con patatas gajo',
    emoji: '🍔',
    momento: ['cena'],
    tiempo: {total: 35},
    raciones: 1,
    etiquetas: ['Capricho'],
    ingredientes: [
      '140 g de carne picada de ternera 5 %',
      {cant: 1, ud: 'ud', n: 'pan de hamburguesa', pl: 'panes de hamburguesa'},
      '30 g de cheddar',
      'Lechuga, tomate, cebolla, pepinillo y mostaza',
      '250 g de patata en gajos'
    ],
    pasos: [
      'Patata a 200 °C 25–30 min.',
      'Hamburguesa formada a mano, solo sal y pimienta, 3 min por lado.',
      'El cheddar encima el último minuto.'
    ],
    macros: {kcal: 665, p: 47, c: 75, g: 20}
  },
  {
    id: 'poke-salmon',
    titulo: 'Poke bowl de salmón',
    emoji: '🐟',
    momento: ['cena'],
    tiempo: {total: 25},
    raciones: 1,
    etiquetas: ['Pescado azul'],
    ingredientes: [
      '90 g de arroz basmati (en seco)',
      '150 g de salmón fresco en dados',
      '60 g de aguacate',
      '60 g de mango',
      'Pepino, zanahoria y cebolleta',
      'Soja, sésamo y lima'
    ],
    pasos: [
      'Arroz cocido y templado.',
      'Salmón (congelado 48 h antes si va crudo) marinado 10 min en soja y lima.',
      'Monta con el resto en crudo.'
    ],
    macros: {kcal: 815, p: 41, c: 89, g: 32}
  },
  {
    id: 'revuelto-gambas',
    titulo: 'Revuelto de gambas con tostada',
    emoji: '🍤',
    momento: ['cena', 'desayuno'],
    tiempo: {total: 15},
    raciones: 1,
    etiquetas: ['Rápida'],
    ingredientes: [
      {cant: 3, ud: 'ud', n: 'huevo M', pl: 'huevos M'},
      '120 g de gambas peladas',
      '80 g de pan de masa madre',
      '100 g de espárragos trigueros',
      '10 ml de aceite de oliva'
    ],
    pasos: [
      'Trigueros a la plancha.',
      'Gambas 1 min en la sartén, añade el huevo y remueve a fuego bajo hasta que cuaje jugoso.',
      'Sobre la tostada.'
    ],
    macros: {kcal: 630, p: 49, c: 43, g: 29}
  },
  {
    id: 'tostadas-huevo-aguacate',
    titulo: 'Tostadas con huevo y aguacate',
    emoji: '🍳',
    momento: ['desayuno'],
    tiempo: {total: 10},
    raciones: 1,
    etiquetas: [],
    ingredientes: [
      '100 g de pan de masa madre',
      {cant: 3, ud: 'ud', n: 'huevo M', pl: 'huevos M', nota: 'revueltos'},
      '60 g de aguacate',
      {cant: 1, ud: 'ud', n: 'naranja', pl: 'naranjas'},
      'Café'
    ],
    pasos: [
      'Tuesta el pan.',
      'Revuelto a fuego bajo, retirándolo cuando aún brille.',
      'Aguacate en láminas encima. Naranja de postre.'
    ],
    macros: {kcal: 650, p: 32, c: 68, g: 27}
  },
  {
    id: 'porridge-platano',
    titulo: 'Porridge de avena, plátano y cacahuete',
    emoji: '🥣',
    momento: ['desayuno', 'pre'],
    tiempo: {total: 8},
    raciones: 1,
    etiquetas: [],
    ingredientes: [
      '70 g de avena',
      '250 ml de leche semidesnatada',
      {cant: 1, ud: 'ud', n: 'plátano', pl: 'plátanos'},
      '15 g de crema de cacahuete',
      '10 g de miel',
      'Canela'
    ],
    pasos: [
      'Avena y leche al fuego 4–5 min removiendo.',
      'Encima plátano, cacahuete, miel y canela.'
    ],
    macros: {kcal: 605, p: 22, c: 92, g: 17}
  },
  {
    id: 'tortitas-avena-platano',
    titulo: 'Tortitas de avena y plátano',
    emoji: '🥞',
    momento: ['desayuno'],
    tiempo: {total: 15},
    raciones: 1,
    etiquetas: ['Día duro'],
    ingredientes: [
      '70 g de avena',
      {cant: 1, ud: 'ud', n: 'plátano', pl: 'plátanos'},
      {cant: 2, ud: 'ud', n: 'huevo M', pl: 'huevos M'},
      '25 g de whey',
      '100 ml de leche',
      'Levadura y canela',
      'Encima: 150 g de yogur griego, 15 g de miel, 15 g de crema de cacahuete y frutos rojos'
    ],
    pasos: [
      'Todo a la batidora.',
      'Sartén antiadherente a fuego medio, 2 min por lado.',
      'Yogur, miel, cacahuete y frutos rojos por encima.'
    ],
    macros: {kcal: 1020, p: 57, c: 102, g: 42}
  },
  {
    id: 'brunch-huevos',
    titulo: 'Brunch de huevos, aguacate y masa madre',
    emoji: '🥑',
    momento: ['desayuno'],
    tiempo: {total: 15},
    raciones: 1,
    etiquetas: ['Brunch'],
    ingredientes: [
      '100 g de pan de masa madre',
      {cant: 3, ud: 'ud', n: 'huevo', pl: 'huevos', nota: 'poché o revueltos'},
      '70 g de aguacate',
      '40 g de jamón serrano',
      'Tomate y aceite de oliva'
    ],
    pasos: [
      'Tuesta el pan y frótalo con tomate y un hilo de aceite de oliva.',
      'Huevos poché (3 min en agua a punto de hervir con un chorro de vinagre) o revueltos.',
      'Monta con el aguacate y el jamón.'
    ],
    macros: {kcal: 755, p: 45, c: 59, g: 39}
  },
  {
    id: 'bocadillo-pavo-queso',
    titulo: 'Bocadillo de pavo y queso',
    emoji: '🥪',
    momento: ['pre', 'desayuno'],
    tiempo: {total: 5},
    raciones: 1,
    etiquetas: ['Sin cocinar', 'Rápida'],
    ingredientes: [
      '100 g de pan de masa madre',
      '80 g de pavo',
      '30 g de queso havarti',
      'Tomate',
      {cant: 1, ud: 'ud', n: 'plátano', pl: 'plátanos'}
    ],
    pasos: [
      'Monta el bocadillo con el tomate en rodajas.',
      'El plátano, de postre o camino del box.'
    ],
    macros: {kcal: 555, p: 32, c: 80, g: 13}
  },
  {
    id: 'arroz-atun',
    titulo: 'Arroz con atún',
    emoji: '🍚',
    momento: ['pre', 'almuerzo'],
    tiempo: {total: 15},
    raciones: 1,
    etiquetas: ['Rápida'],
    ingredientes: [
      '70 g de arroz basmati (en seco)',
      {cant: 1, ud: 'ud', n: 'lata de atún', pl: 'latas de atún'},
      'Tomate rallado',
      'aceite de oliva',
      {cant: 3, ud: 'ud', n: 'dátil', pl: 'dátiles'}
    ],
    pasos: [
      'Cuece el arroz (o usa uno de vaso).',
      'Mezcla con el atún escurrido, el tomate rallado y un hilo de aceite de oliva.',
      'Dátiles de postre.'
    ],
    macros: {kcal: 530, p: 26, c: 73, g: 14}
  },
  {
    id: 'tostadas-cacahuete-miel',
    titulo: 'Tostadas de cacahuete y miel',
    emoji: '🍯',
    momento: ['pre', 'desayuno'],
    tiempo: {total: 5},
    raciones: 1,
    etiquetas: ['Rápida'],
    ingredientes: [
      '80 g de pan de masa madre',
      '20 g de crema de cacahuete',
      '10 g de miel',
      {cant: 1, ud: 'ud', n: 'plátano', pl: 'plátanos'},
      '200 g de queso batido 0 %'
    ],
    pasos: [
      'Tuesta el pan, unta el cacahuete y la miel.',
      'Plátano en rodajas encima y el queso batido aparte.'
    ],
    macros: {kcal: 555, p: 29, c: 86, g: 12}
  }
];

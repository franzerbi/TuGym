# TuGym
Web app para registrar entrenamientos de gimnasio, hacer seguimiento del peso corporal y visualizar el progreso en cada ejercicio a lo largo del tiempo.

Proyecto personal pensado para uso diario en el celular, instalable como PWA (Progressive Web App).

> **Estado del proyecto:** En desarrollo activo · v0.1.0

---

## ¿Por qué este proyecto?

La mayoría de las apps que existen o tienen modelos de suscripción que no estoy dispuesto a pagar, o no tienen todas las funciones que me parecen necesarias. Por eso decidí hacer la mía:

- Armar una rutina a mano.
- Registrar series con peso y repeticiones de manera rápida durante el entrenamiento.
- Mostrar de un vistazo cómo evoluciona el peso que levanto en cada ejercicio.
- Llevar registro de mi peso corporal en paralelo.

---

## Funcionalidades

### v1.0 (MVP) — En desarrollo

- [ ] Crear, editar y eliminar ejercicios, organizados por grupo muscular
- [ ] Registrar entrenamientos con múltiples ejercicios y series (peso × repeticiones)
- [ ] Ver historial de entrenamientos por fecha
- [ ] Ver gráfico de progreso por ejercicio (peso máximo a lo largo del tiempo)
- [ ] Registrar peso corporal con fecha
- [ ] Ver gráfico de evolución del peso corporal
- [ ] Persistencia local de datos (sin necesidad de cuenta ni conexión)
- [ ] Diseño responsive optimizado para uso en celular
- [ ] Instalable como PWA en iOS y Android

### Roadmap

Features planeadas para versiones futuras:

- Plantillas de rutinas (ej: Lunes — Pecho y hombros)
- Cronómetro de descanso entre series
- Detección automática de récords personales (PRs)
- Estadísticas avanzadas: volumen total, tonelaje, 1RM estimado
- Backup y sincronización en la nube

---

## Stack tecnológico

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Base de datos:** IndexedDB local vía [Dexie.js](https://dexie.org/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Deploy:** [Vercel](https://vercel.com/)
- **Control de versiones:** Git + GitHub

### Decisiones de arquitectura

**¿Por qué web app y no nativa?** Web app instalable como PWA cubre el caso de uso (uso personal en un celular) sin las complicaciones de publicar en App Store / Play Store, y ademas porque esto lo considero un proyecto personal para mi propio uso. La experiencia en iOS es prácticamente equivalente a una app nativa una vez agregada a la pantalla de inicio.

**¿Por qué IndexedDB y no una base de datos en la nube?** Los datos son personales y no requieren acceso desde múltiples dispositivos en esta versión. IndexedDB ofrece persistencia local robusta, sin costo, sin login, y respetando la privacidad del usuario por defecto. Una migración futura a Postgres + Supabase es viable si decido expandir.

**¿Por qué Next.js si no hay backend complejo?** Por DX (developer experience), routing limpio, optimización de imágenes y bundle, y deploy de un click en Vercel. Aunque la app sea principalmente client-side, Next.js sigue siendo la opción más sólida del ecosistema React en 2026.

---

## Modelo de datos

```
exercises
├── id (PK)
├── name              ej: "Press de banca"
├── muscle_group      ej: "Pecho"
└── created_at

workouts
├── id (PK)
├── date
└── notes

sets
├── id (PK)
├── workout_id        FK → workouts
├── exercise_id       FK → exercises
├── weight_kg
├── reps
└── set_number        1, 2, 3...

body_weight
├── id (PK)
├── date
├── weight_kg
└── notes
```


## Estructura del proyecto

```
TuGym/
├── app/                  Rutas y páginas (Next.js App Router)
├── components/           Componentes React reutilizables
├── lib/                  Lógica de negocio y acceso a datos
│   ├── db/               Configuración de Dexie e IndexedDB
│   └── utils/            Funciones utilitarias
├── public/               Assets estáticos (íconos, manifest)
├── types/                Tipos de TypeScript compartidos
└── README.md
```

## Autor

**Francisco Zerbino**
Estudiante de Licenciatura en Informática — Universidad de Montevideo

- LinkedIn: [Francisco Zerbino](https://www.linkedin.com/in/francisco-zerbino-618a80331)
- GitHub: [@franzerbi](https://github.com/franzerbi)


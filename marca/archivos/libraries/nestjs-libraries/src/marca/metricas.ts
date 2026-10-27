// Dímelo Redes: nombres de las métricas de Analíticas en español, para todas las redes.
// Las redes devuelven el nombre en inglés (a veces en mayúsculas o con guiones bajos); aquí se compara sin
// mayúsculas ni guiones. Un nombre que no esté en la lista se queda como viene.
const METRICAS: Record<string, string> = {
  // Facebook
  'page impressions': 'Alcance de la página',
  'media views': 'Visualizaciones',
  'posts engagement': 'Interacciones',
  'page followers': 'Nuevos seguidores',
  'clicks by type': 'Clics por tipo',
  reactions: 'Reacciones',
  plays: 'Reproducciones',
  // Comunes
  impressions: 'Impresiones',
  'unique impressions': 'Impresiones únicas',
  impression: 'Impresiones',
  views: 'Visualizaciones',
  reach: 'Alcance',
  engagement: 'Interacciones',
  likes: 'Me gusta',
  like: 'Me gusta',
  comments: 'Comentarios',
  shares: 'Compartidos',
  saves: 'Guardados',
  clicks: 'Clics',
  followers: 'Seguidores',
  'follower count': 'Seguidores',
  following: 'Siguiendo',
  videos: 'Videos',
  // LinkedIn
  'page views': 'Visitas a la página',
  'organic followers': 'Seguidores orgánicos',
  'paid followers': 'Seguidores por anuncios',
  // YouTube
  'estimated minutes watched': 'Minutos vistos',
  'average view duration': 'Duración media vista',
  'average view percentage': 'Porcentaje medio visto',
  'subscribers gained': 'Suscriptores nuevos',
  'subscribers lost': 'Suscriptores perdidos',
  favorites: 'Favoritos',
  // TikTok
  'total likes': 'Me gusta en total',
  'recent likes': 'Me gusta recientes',
  'recent comments': 'Comentarios recientes',
  'recent shares': 'Compartidos recientes',
  // Pinterest
  'pin click rate': 'Tasa de clics en el pin',
  'pin clicks': 'Clics en el pin',
  'outbound clicks': 'Clics hacia tu web',
  // Threads y X
  replies: 'Respuestas',
  reply: 'Respuestas',
  reposts: 'Compartidos',
  quotes: 'Citas',
  quote: 'Citas',
  retweets: 'Compartidos',
  retweet: 'Compartidos',
  bookmarks: 'Guardados',
  bookmark: 'Guardados',
  // Google Business
  'website clicks': 'Clics a la web',
  'phone calls': 'Llamadas',
  'direction requests': 'Cómo llegar',
  'desktop map views': 'Vistas en el mapa (computadora)',
  'mobile map views': 'Vistas en el mapa (celular)',
};

export const traducirMetrica = (nombre: string) =>
  METRICAS[String(nombre || '').replace(/_/g, ' ').trim().toLowerCase()] ||
  nombre;

export const traducirMetricas = <T>(datos: T): T =>
  Array.isArray(datos)
    ? (datos.map((d) =>
        d && typeof d === 'object' && 'label' in d
          ? { ...d, label: traducirMetrica((d as { label: string }).label) }
          : d
      ) as T)
    : datos;

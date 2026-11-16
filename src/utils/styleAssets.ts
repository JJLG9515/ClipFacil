import type { ReelStyle } from '../types/reel';
import educativoImg from '../assets/images/backdrop_educativo_clean_1794787497459.jpg';
import divertidoImg from '../assets/images/backdrop_divertido_1794787483218.jpg';
import motivacionalImg from '../assets/images/backdrop_motivacional_clean_1794787497515.jpg';
import esteticoImg from '../assets/images/backdrop_estetico_1794787484143.jpg';
import noticiasImg from '../assets/images/backdrop_noticias_1794787485030.jpg';

export const STYLE_BACKDROP_IMAGES: Record<ReelStyle, string> = {
  Educativo: educativoImg,
  Divertido: divertidoImg,
  Motivacional: motivacionalImg,
  Estético: esteticoImg,
  Noticias: noticiasImg,
};

import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  typography: {
    fontFamily: [
      'Nunito',    // Nunito als erste Wahl
      'sans-serif', // Fallback, falls Nunito nicht geladen werden kann
    ].join(','),
    // Du kannst hier auch spezifische Schriftgrößen, Gewichte usw. für jede Variante anpassen
    // h1: {
    //   fontSize: '3rem',
    //   fontWeight: 800,
    // },
    // body1: {
    //   fontSize: '1rem',
    //   fontWeight: 400,
    // },
}})

export default muiTheme;
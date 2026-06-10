// Plotly "basic" build (~1MB vs 4.8MB del completo).
// Incluye scatter, bar, pie — todos los tipos que usa la app.
// Este modulo se carga lazy (React.lazy) desde shared.tsx.
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist-min'

export default createPlotlyComponent(Plotly)

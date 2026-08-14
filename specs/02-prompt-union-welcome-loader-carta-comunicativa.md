1. Hace falta en `/Evaluación` que al dar clic dentro de la carta comunicativa, permita la edicion del concepto como tal, este concepto cuando se asigna a un estudiante en su carta comunicativa, debe tomar una copia y guardarla dentro de la estructura de datos. Asi se modifique un concepto desde su descripcion, las cartas comunicativas de los estudiantes que ya se instanciaron, no se vean alteradas, pues tienen una captura en el tiempo de como estaba la descripcion de ese concepto. Recuerda que si existen 2 conceptos del mismo **periodo, dimension, estado(logrado, ...)** debe permitir desplegar la seleccion. Para esta funcion de editar usa el icono de *Lucide* `square-pen`.

2. En `/Evaluación` en la Carta Comunicativa, vamos a ajusta la vista, en el lado derecho en una proporcion aparecera el estado del logro alcanzado por DImension, (logrado, en proceso, con dificultad). Debe aparecer el estado como ahora aparece (punto + estado) al pie del cuadro, arriba un logo svg, que tendremos en `E:\dev\startup\quartz-rpt-02\quartz-web\src\assets\images`:

Iconos:

Logrado: `achieved-icon.svg`
En proceso: `in-process-icon.svg`
Con dificultad: `with-dificulty-icon.svg`

Estos se visualizan unicamente para la aplicacion en web, para generar el pdf, debe consumir los archivos en al ubicacion igual aa la anterior pero que son jpg. 

3. De igual manera en `/Informes` Carta comunicativa, debes tomar las imagenes jpg, para que no se demore el procesamiento en PDF, necesito que el proceso aca sea prolijo, porque puede que una imagen se necesite en varios estados de conceptos, asi que optimiza de manera eficiente los recursos y tiempos. Elimina del pdf, el texto que dice: "A continuación se presenta el desempeño de <nombre del estudiante> durante Periodo 2 , según lo valorado por el docente en cada
dimensión"
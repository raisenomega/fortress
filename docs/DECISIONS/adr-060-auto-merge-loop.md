# ADR-060: Merge automático bajo política firmada en modo autónomo

**Estado:** Aceptada
**Fecha:** 2026-08-13
**Autor:** operador

## Contexto

El motor de auto-reparación completa hoy su cadena hasta el veredicto del
revisor y ahí se detiene: la firma es un merge manual del operador en su
terminal, una propuesta cada vez. Esa forma es coherente mientras el motor
trabaja a petición, pero no se sostiene en el modo autónomo prolongado, donde el
sistema recorre hallazgos sin parar. Con firma por acto, el modo autónomo
produce una cola que nadie consume; sin firma alguna, se pierde el freno que
justifica todo el diseño.

Hay una asimetría que conviene nombrar antes de decidir. **Integrar un fix en la
rama local y publicarlo al remoto son dos actos distintos**, con riesgos
distintos. La publicación ya tiene tres frenos mecánicos codificados —sin
remoto, sin escaneo previo, o con hallazgos críticos abiertos— y sigue siendo un
gesto humano explícito. Este registro trata **solo de la integración local**. La
publicación no cambia: sigue siendo del operador, con sus frenos intactos.

La otra cuestión que este registro tuvo que resolver apareció al diseñar la
lista de exclusión. La intuición inicial fue organizarla por dominios sensibles
—autenticación, pagos, migraciones—, que es como se piensa una auditoría de
código convencional. Pero en un sistema que ejecuta sus propias reglas, los
archivos más delicados no son los que procesan datos de usuario: son los que
deciden qué puede hacer el sistema. Una lista por dominios los deja fuera, y con
ella el motor podría integrar por su cuenta un cambio a los frenos que lo
gobiernan.

## Alternativas consideradas

- **Integrar todo lo que el revisor apruebe:** descartada — colapsa la
  distinción entre severidades y deja pasar cambios estructurales grandes sin
  que nadie los mire. El revisor juzga si el fix resuelve el hallazgo, no si el
  operador quería ese cambio en su rama.
- **Firma por acto para todo, con un botón en la interfaz:** descartada como
  cierre único — traslada el gesto sin resolver el problema, porque el modo
  autónomo prolongado sigue deteniéndose en cada propuesta. Queda como
  complemento para las severidades altas, que sí la conservan.
- **Reutilizar la lista de áreas protegidas que ya existe:** descartada — esa
  lista compara palabras contra el TEXTO de una petición del operador, y aquí
  hace falta comparar RUTAS de los archivos que el fix modifica. Son dos
  semánticas distintas con la misma apariencia; forzar la reutilización produce
  a la vez falsos positivos y falsos negativos.
- **Ante una configuración ilegible, aplicar la lista por defecto:** descartada
  — es el sesgo cómodo, no el seguro. Un proyecto declara su propia lista
  precisamente porque la genérica no le sirve; caer a la genérica cuando el
  archivo falla aplica MENOS protección de la que el operador pidió, justo en el
  momento en que se ha perdido la capacidad de saber qué pidió.
- **Firmar el principio nuevo como axioma, sin manifestaciones:** descartada —
  crear una categoría de principios que no necesitan evidencia erosiona la
  disciplina que produjo el principio 20, y deja el listón en manos de quien
  propone. No hizo falta: la evidencia ya existía.

## Decisión

**La integración automática procede solo dentro de una política declarada**, y
únicamente en modo autónomo sobre un proyecto de confianza. Las cuatro
condiciones son acumulativas: severidad baja o media, diferencia menor de veinte
líneas, hasta cinco archivos, y ningún archivo tocado dentro de la lista de
exclusión del proyecto. Incumplir cualquiera detiene la propuesta y la deja
esperando al operador. Las severidades alta y crítica conservan la firma por
acto, siempre.

**El modo autónomo se detiene por presupuesto**, con la misma guarda que ya
protege el resto del sistema y en la misma unidad: dólares reales acumulados
desde medianoche. No se añade un tope de "tantas integraciones seguidas": el
gasto ya es la medida que importa.

**Un veredicto negativo no detiene el ciclo.** La propuesta rechazada queda
visible con su veredicto y su razón, y el sistema pasa al siguiente hallazgo. El
operador la revisa cuando quiere, sin bloquear el trabajo en curso.

**La lista de exclusión se declara por proyecto**, con patrones de ruta, en un
archivo de configuración en su raíz. Un proyecto sin ese archivo usa la lista
por defecto. Un proyecto cuyo archivo existe pero no se puede leer **pierde la
integración automática** hasta que se corrija: el motor sigue proponiendo, pero
no integra. La distinción entre "no configurado" y "configurado e ilegible" es
deliberada — la primera es una ausencia de intención, la segunda es una
intención que no se puede verificar.

**El estado del modo autónomo se muestra en la barra superior**, distinguiendo
cuatro situaciones que hoy se confunden: en marcha, terminado sin pendientes,
terminado con propuestas por revisar, y detenido. El detalle de cada ciclo vive
en una vista propia.

## Principio 21

Este registro firma un principio nuevo, con dos manifestaciones documentadas el
mismo día sobre superficies distintas:

> **Un sistema no aplica por su cuenta un cambio a las reglas que gobiernan lo
> que puede aplicar por su cuenta.** Proponer sí; aplicar sin revisión externa,
> no. Alcanza a los archivos que implementan la política de autonomía y al
> archivo que declara esa política, que se cubre a sí mismo por defecto.

**Primera manifestación.** El terminal de la aplicación, en modo autónomo sobre
el propio repositorio, podía editar los archivos que codifican sus propios
frenos. Una petición cotidiana —limpiar código muerto, simplificar una
función— sobre uno de ellos podía desmontar la jaula desde dentro, sin mala
intención y sin revisor. Se cerró degradando el modo cuando el objetivo es el
repositorio propio.

**Segunda manifestación.** La lista de exclusión organizada por dominios de
negocio dejaba esos mismos archivos fuera de cobertura, de modo que el motor
podría integrarlos por su cuenta. Misma clase de daño, otra puerta.

**Regla de auto-cobertura.** El archivo de configuración que declara la lista de
exclusión **se excluye a sí mismo, siempre, sin que el proyecto tenga que
declararlo**. Si esa protección fuese declarativa sería eliminable por
declaración: bastaría una propuesta que la borrase para abrir todo lo demás. La
protección es estructural, no configurable.

Nótese la distinción que el enunciado preserva: el motor **sí puede proponer**
cambios sobre esos archivos —son código como cualquier otro y pueden tener
defectos—; lo que no puede es integrarlos sin que un humano los mire.

## Consecuencias

### Positivas
- El modo autónomo prolongado pasa a ser viable sin renunciar al freno: la firma
  se traslada del acto a la política, y la política la firma un humano.
- La publicación al remoto no cambia, y sus tres frenos mecánicos siguen
  intactos. Nada llega al mundo por decisión del motor.
- Un veredicto negativo deja de ser un tapón: el ciclo continúa y la propuesta
  espera revisión sin bloquear.
- La mayor parte de lo necesario ya existe y se reutiliza — el libro donde el
  revisor asienta sus decisiones, el canal que publica el estado del modo
  autónomo, la plantilla de indicador de la barra superior, y la práctica ya
  establecida de leer configuración en formato JSON desde la raíz del proyecto.

### Negativas
- Cada proyecto que quiera integración automática tiene que decidir su lista de
  exclusión. Es fricción real, y deliberada: quien no la decide se queda con la
  lista por defecto, más restrictiva.
- La política vive en código, así que un defecto en su evaluador podría integrar
  algo fuera de lo firmado. Exige cobertura de pruebas proporcional al riesgo.
- Distinguir integración de publicación añade una idea más que explicar a quien
  llega nuevo al proyecto.

### Neutras
- La política es conservadora a propósito. Ampliarla más adelante, con
  observación real detrás, es fácil; lo que no se puede es aplicar
  retroactivamente un criterio nuevo a lo que el sistema ya integró.
- Ningún proyecto tiene hoy el archivo de configuración, así que todos operan
  con la lista por defecto hasta que declaren la suya.
- El principio 21 no prohíbe que el sistema razone sobre sus propias reglas.
  Prohíbe que las cambie solo.

## Referencias

- [ADR-058](adr-058-capas-de-exclusion-explicitas.md) — el precedente de
  declarar cada exclusión en su capa, sin herencia.
- [ADR-059](adr-059-capas-de-estado-no-heredan.md) — principio 20, del que este
  registro hereda el método: firmar cuando la evidencia se acumula.
- [PRINCIPLES](../PRINCIPLES.md) — principio 21 (enunciado canónico) y
  principio 12 (los estados terminales no se re-abren).
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la cadena del motor y la firma
  humana que este registro modifica en su tramo final.
- [ROADMAP](../ROADMAP.md) — el cierre e integración del motor, que este
  registro habilita.

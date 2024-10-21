import { useEffect, useRef, useState } from 'react'; // Импорт хуков для работы с состоянием и жизненным циклом компонента
import { InputNumber, Button, Checkbox } from 'antd'; // Импорт компонентов из Ant Design
import getCanvasNCtx from '../../utils/getCanvasNCtx'; // Импорт вспомогательной функции для работы с canvas
import './CurvesModal.css'; // Импорт CSS для стилизации компонента

// Интерфейс для пропсов компонента CurvesModal
export interface CurvesModalProps {
  imageRef: React.RefObject<HTMLCanvasElement>; // Ссылка на canvas с изображением
  onGammaCorrectionChange: (data: string) => void; // Функция обратного вызова для изменения гамма-коррекции
  closeModal: () => void; // Функция закрытия модального окна
}

// Интерфейс для данных о цветах (красный, зеленый, синий)
interface ColorRowsI {
  r: Map<number, number>; // Частоты интенсивности красного цвета
  g: Map<number, number>; // Частоты интенсивности зеленого цвета
  b: Map<number, number>; // Частоты интенсивности синего цвета
}

// Основной компонент CurvesModal
const CurvesModal = ({
  imageRef, // Ссылка на изображение
  onGammaCorrectionChange, // Коллбэк для применения гамма-коррекции
  closeModal // Функция закрытия модального окна
}: CurvesModalProps) => {
  const histRef = useRef<HTMLCanvasElement>(null); // Ссылка на canvas для гистограммы
  const previewRef = useRef<HTMLCanvasElement>(null); // Ссылка на canvas для предварительного просмотра
  const [curvePoints, setCurvePoints] = useState({
    "enter": { // Начальная точка кривой
      "in": 0,
      "out": 0,
    },
    "exit": { // Конечная точка кривой
      "in": 255,
      "out": 255,
    },
  });
  const [isPreview, setIsPreview] = useState(false); // Флаг для отображения предварительного просмотра

  // Первый useEffect для инициализации гистограммы при загрузке компонента
  useEffect(() => {
    const colorsHistData = getColorsHistData(); // Получение данных гистограммы
    buildColorRows(colorsHistData); // Построение цветовых рядов гистограммы
  }, []);

  // Второй useEffect для отрисовки кривой при изменении точек
  useEffect(() => {
    const [canvas, ctx] = getCanvasNCtx(histRef); // Получаем canvas и контекст
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем canvas перед отрисовкой

    const colorsHistData = getColorsHistData(); // Получаем данные гистограммы
    buildColorRows(colorsHistData); // Рисуем гистограмму
    
    // Код для отрисовки кривой
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 255 - curvePoints.enter.out); // Начальная точка кривой
    ctx.lineTo(curvePoints.enter.in, 255 - curvePoints.enter.out); // Линия до новой точки
    ctx.lineTo(curvePoints.exit.in, 255 - curvePoints.exit.out); // Линия до конечной точки
    ctx.lineTo(255, 255 - curvePoints.exit.out); // Заключительная линия кривой
    ctx.stroke();

    if (isPreview) { // Если включен предварительный просмотр
      previewRender(); // Запускаем рендеринг превью
    }
  }, [curvePoints]); // Срабатывает при изменении точек кривой

  // Третий useEffect для рендеринга превью при изменении флага isPreview
  useEffect(() => {
    if (isPreview) {
      previewRender(); // Обновляем рендеринг превью
    }
  }, [isPreview]);

  // Функция для рендеринга изображения в превью
  const previewRender = () => {
    const [canvas, _] = getCanvasNCtx(imageRef); // Получаем основной canvas
    const [tempCanvas, tempCtx] = getCanvasNCtx(previewRef); // Получаем canvas для превью

    tempCanvas.width = canvas.width; // Устанавливаем размеры превью
    tempCanvas.height = canvas.height;
    
    const tempImageData = getTempImageData(); // Получаем данные изображения с гамма-коррекцией
    tempCtx?.putImageData(tempImageData, 0, 0); // Отрисовываем обновленные данные
  };

  // Функция для получения данных гистограммы
  const getColorsHistData = () => {
    const [canvas, ctx] = getCanvasNCtx(imageRef); // Получаем canvas изображения
    const canvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Получаем пиксельные данные
    const srcData = canvasImageData.data; // Данные изображения
        
    const colorsHistData: ColorRowsI = { // Инициализация данных гистограммы
      "r": new Map(), // Красный канал
      "g": new Map(), // Зеленый канал
      "b": new Map(), // Синий канал
    };
    for (let i = 0; i < srcData.length; i += 4) { // Проход по пикселям
      if (colorsHistData["r"].has(srcData[i])) {
        colorsHistData["r"].set(srcData[i], colorsHistData["r"].get(srcData[i])! + 1); // Считаем частоты для красного
      } else {
        colorsHistData["r"].set(srcData[i], 0);
      }
      if (colorsHistData["g"].has(srcData[i + 1])) {
        colorsHistData["g"].set(srcData[i + 1], colorsHistData["g"].get(srcData[i + 1])! + 1); // Считаем частоты для зеленого
      } else {
        colorsHistData["g"].set(srcData[i + 1], 0);
      }
      if (colorsHistData["b"].has(srcData[i + 2])) {
        colorsHistData["b"].set(srcData[i + 2], colorsHistData["b"].get(srcData[i + 2])! + 1); // Считаем частоты для синего
      } else {
        colorsHistData["b"].set(srcData[i + 2], 0);
      }
    }
    return colorsHistData; // Возвращаем данные гистограммы
  }

  // Функция для построения цветовых рядов гистограммы
  const buildRGBColorRows = (data: ColorRowsI, color: "r" | "g" | "b") => {
    const [canvas, ctx] = getCanvasNCtx(histRef);
    const maxVal = Math.max(...data["r"].values(), ...data["g"].values(), ...data["b"].values()); // Максимальное значение для масштабирования
    if (color === "r") {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.65)'; // Красный цвет для гистограммы
    } else if (color === "g") {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.65)'; // Зеленый цвет для гистограммы
    } else {
      ctx.fillStyle = 'rgba(0, 0, 255, 0.65)'; // Синий цвет для гистограммы
    }
    for (let i of [...data[color].keys()].sort()) { // Проходим по каждому значению интенсивности

      const h = Math.floor(data[color].get(i)! * 256 / maxVal); // Высота столбца гистограммы
      ctx.fillRect(i, canvas.height, 1, -h); // Рисуем столбец
    }
  };

  // Функция для построения всех цветовых рядов
  const buildColorRows = (data: ColorRowsI) => {
    const [canvas, ctx] = getCanvasNCtx(histRef);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем canvas
    buildRGBColorRows(data, "r"); // Строим красный ряд
    buildRGBColorRows(data, "g"); // Строим зеленый ряд
    buildRGBColorRows(data, "b"); // Строим синий ряд
  };

    // Функция для изменения точек кривой
    const changeCurvePoints = (
      e: React.KeyboardEvent<HTMLInputElement>, 
      point: "enter" | "exit", // Определяем, какую точку изменяем (начало или конец кривой)
      pointParam: "in" | "out" // Определяем, изменяем ли входное или выходное значение
    ) => {
      if (point === "enter" && pointParam === "in") {
        if (parseInt((e.target as HTMLInputElement).value) > curvePoints.exit.in) return; // Ограничение: начало кривой не может быть больше конца
      }
      if (point === "exit" && pointParam === "in") {
        if (parseInt((e.target as HTMLInputElement).value) < curvePoints.enter.in) return; // Ограничение: конец кривой не может быть меньше начала
      }
      setCurvePoints({
        ...curvePoints, // Копируем текущие точки кривой
        [point]: {
          ...curvePoints[point], // Обновляем только выбранную точку
          [pointParam]: parseInt((e.target as HTMLInputElement).value) // Применяем новое значение
        }
      })
    }
  
    // Сброс точек кривой до исходных значений
    const resetCurvePoints = () => {
      setCurvePoints({
        enter: {
          in: 0,
          out: 0,
        },
        exit: {
          in: 255,
          out: 255,
        }
      })
    }
  
    // Функция для получения временных данных изображения с применением гамма-коррекции
    const getTempImageData = () => {
      const [canvas, ctx] = getCanvasNCtx(imageRef); // Получаем canvas изображения
      const srcImageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data; // Получаем данные пикселей
      const newImageData = new Uint8ClampedArray(canvas.width * canvas.height * 4); // Создаем массив для нового изображения
      
      // Координаты двух точек для кривой
      const x1 = curvePoints.enter.in;
      const y1 = curvePoints.enter.out;
      const x2 = curvePoints.exit.in;
      const y2 = curvePoints.exit.out;
  
      // Вычисляем параметры для линейной функции между двумя точками
      const a = (y2 - y1) / (x2 - x1); // Коэффициент наклона
      const b = y1 - a * x1; // Смещение
  
      // Применение гамма-коррекции к каждому пикселю
      const changePixelGammaCorrection = (i: number) => {
        if (srcImageData[i] <= x1) {
          newImageData[i] = y1; // Если значение пикселя меньше x1, ставим y1
        } else if (srcImageData[i] >= x2) {
          newImageData[i] = y2; // Если значение пикселя больше x2, ставим y2
        } else {
          newImageData[i] = a * srcImageData[i] + b; // Иначе вычисляем новое значение через линейную интерполяцию
        }
      };
  
      // Применяем коррекцию ко всем пикселям (R, G, B)
      for (let i = 0; i < newImageData.length; i += 4) {
        changePixelGammaCorrection(i);     // Коррекция для красного
        changePixelGammaCorrection(i + 1); // Коррекция для зеленого
        changePixelGammaCorrection(i + 2); // Коррекция для синего
        newImageData[i + 3] = srcImageData[i + 3]; // Альфа-канал остается неизменным
      }
  
      const tempImageData = new ImageData(newImageData, canvas.width, canvas.height); // Создаем новое изображение с измененными данными
      return tempImageData; // Возвращаем измененные данные
    }
  
    // Функция для изменения гамма-коррекции
    const changeGammaCorrection = () => {
      const [canvas, _] = getCanvasNCtx(imageRef); // Получаем canvas изображения
      const [tempCanvas, tempCtx] = getCanvasNCtx(previewRef); // Получаем canvas для предварительного просмотра
  
      tempCanvas.width = canvas.width; // Устанавливаем размеры для превью
      tempCanvas.height = canvas.height;
      
      const tempImageData = getTempImageData(); // Получаем данные с примененной гамма-коррекцией
      tempCtx?.putImageData(tempImageData, 0, 0); // Отрисовываем их на canvas превью
      onGammaCorrectionChange(tempCanvas.toDataURL()); // Передаем результат в виде Data URL
    }
  
    return (
      <div className='curves-modal'> {/* Основная обертка модального окна */}
        <canvas
          ref={ histRef } // Ссылка на canvas для отображения гистограммы
          className='hist-canvas' 
          width={ 256 } 
          height={ 256 }
        />
        <div className="curves-inputs"> {/* Контейнер для инпутов изменения кривой */}
          <div className="curves-input"> {/* Ввод для начальной точки кривой */}
            <p className='curves-input-label'>In</p>
            <InputNumber
                min={ 0 }
                max={ 255 }
                value={ curvePoints.enter.in } // Значение начальной точки кривой
                onPressEnter={ (e) => changeCurvePoints(e, "enter", "in") } // Обработчик ввода для начальной точки
                placeholder='In'
            />
            <p className='curves-input-label'>Out</p>
            <InputNumber
                min={ 0 }
                max={ 255 }
                value={ curvePoints.enter.out } // Значение для выхода начальной точки
                onPressEnter={ (e) => changeCurvePoints(e, "enter", "out") } // Обработчик для изменения выхода
                placeholder='Out'
            />
          </div>
          <div className="curves-input"> {/* Ввод для конечной точки кривой */}
            <p className='curves-input-label'>In</p>
            <InputNumber
                min={ 0 }
                max={ 255 }
                value={ curvePoints.exit.in } // Значение конечной точки кривой
                onPressEnter={ (e) => changeCurvePoints(e, "exit", "in") } // Обработчик для изменения конечной точки
                placeholder='In'
            />
            <p className='curves-input-label'>Out</p>
            <InputNumber
                min={ 0 }
                max={ 255 }
                value={ curvePoints.exit.out } // Значение для выхода конечной точки
                onPressEnter={ (e) => changeCurvePoints(e, "exit", "out") } // Обработчик для изменения выхода конечной точки
                placeholder='Out'
            />
          </div>
        </div>
        <canvas
          ref={ previewRef } // Ссылка на canvas для предварительного просмотра
          className='preview' 
          style={{
            height: !isPreview ? 0 : '' // Управляем видимостью превью
          }}
        />
        <div className="curves-btns"> {/* Кнопки управления */}
          <Button type='primary' onClick={ () => { 
            changeGammaCorrection(); // Применяем гамма-коррекцию
            closeModal(); // Закрываем модальное окно
          }}>
            Изменить
          </Button>
          <Checkbox checked={ isPreview } onClick={ () => setIsPreview(!isPreview) }> {/* Чекбокс для переключения предварительного просмотра */}
            Предпросмотр
          </Checkbox>
          <Button onClick={ resetCurvePoints }> {/* Кнопка для сброса точек кривой */}
            Сбросить
          </Button>
        </div>
      </div>
    )
  };
  
  export default CurvesModal;
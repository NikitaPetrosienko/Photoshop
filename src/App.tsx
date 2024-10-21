import React, { useEffect, useRef, useState } from 'react'; // Импортируем React и хуки useEffect, useRef, useState для управления состоянием и ссылками
import { Tabs, Modal, Button } from 'antd'; // Импортируем компоненты из библиотеки Ant Design
import { SidePanel } from "./components/SidePanel/SidePanel"; // Импорт компонента боковой панели
import ChangeSizeModal from './components/ChangeSizeModal/ChangeSizeModal'; // Модальное окно для изменения размера изображения
import tabsItemsOnFunc from './utils/tabsItemsOnFunc'; // Утилита для генерации вкладок
import getNewDataNearestNeighbour from './utils/getNewDataNearestNeighbour'; // Утилита для изменения размеров изображения методом ближайшего соседа
import Footer from './components/Footer/Footer'; // Компонент футера
import CurvesModal from './components/CurvesModal/CurvesModal'; // Модальное окно для изменения кривых изображения
import FilterModal from './components/FilterModal/FilterModal'; // Модальное окно для фильтров
import getCanvasNCtx from './utils/getCanvasNCtx'; // Утилита для получения canvas и контекста
import './App.css'; // Стили
import IconButton from "./components/IconButton/IconButton"; // Кнопка с иконкой
import { ReactComponent as HandSvg } from "./assets/hand.svg"; // SVG для иконки "рука"
import { ReactComponent as PipetteSvg } from "./assets/pipette.svg"; // SVG для иконки "пипетка"

// Интерфейсы для типизации данных приложения
export interface LoadedImageI {
  imageUri: string; // URI изображения
  imageOriginalWidth: number; // Оригинальная ширина изображения
  imageOriginalHeight: number; // Оригинальная высота изображения
}

export interface PixelInfoI {
  rgb: [number, number, number]; // Цвет пикселя в формате RGB
  x: number; // Координата X пикселя
  y: number; // Координата Y пикселя
}

interface ModalI {
  show: boolean; // Флаг отображения модального окна
  title: string; // Заголовок модального окна
  content: React.ReactNode; // Контент модального окна
}

// Главный компонент приложения
function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ссылка на canvas
  const imgViewRef = useRef<HTMLDivElement>(null); // Ссылка на блок для просмотра изображения
  const dragRef = useRef({
    drag: false, // Флаг, указывающий на состояние перетаскивания
    startX: 0, // Начальная X-координата при начале перетаскивания
    startY: 0, // Начальная Y-координата
    scrollX: 0, // Начальное положение по X
    scrollY: 0, // Начальное положение по Y
  });
  const [loadedImage, setLoadedImage] = useState<LoadedImageI>({
    imageUri: '', // URI загруженного изображения
    imageOriginalWidth: 0, // Оригинальная ширина
    imageOriginalHeight: 0, // Оригинальная высота
  });
  const [scale, setImageScale] = useState(100); // Масштаб изображения
  const [pixelInfo, setPixelInfo] = useState<PixelInfoI>({ rgb: [0, 0, 0], x: 0, y: 0 }); // Информация о пикселе
  const [modal, setModal] = useState<ModalI>({ show: false, title: '', content: null }); // Модальное окно
  const [currentTool, setCurrentTool] = useState(0); // Текущий инструмент (0 - рука, 1 - пипетка)
  const [color1, setColor1] = useState<PixelInfoI>({ rgb: [0, 0, 0], x: 0, y: 0 }); // Первый цвет для пипетки
  const [color2, setColor2] = useState<PixelInfoI>({ rgb: [0, 0, 0], x: 0, y: 0 }); // Второй цвет для пипетки

  // Загружаем изображение и отображаем его при изменении URI
  useEffect(() => {
    const imgPromise = imageUriToImgPromise(loadedImage.imageUri); // Преобразуем URI в объект изображения
    imgPromise.then((img) => {
      renderImageFull(img); // Рисуем изображение на canvas
      setLoadedImage({
        ...loadedImage,
        imageOriginalWidth: img.naturalWidth, // Обновляем оригинальную ширину изображения
        imageOriginalHeight: img.naturalHeight, // Обновляем оригинальную высоту изображения
      });
    });
  }, [loadedImage.imageUri]);

  // Изменяем масштаб изображения при изменении значения слайдера
  useEffect(() => {
    changeImageScale(scale); // Вызываем функцию изменения масштаба
  }, [scale]);

  // Преобразование URI в изображение с использованием промиса
  const imageUriToImgPromise = (uri: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image(); // Создаем объект изображения
      img.src = uri; // Устанавливаем источник изображения
      img.onload = () => {
        resolve(img); // Возвращаем объект изображения после загрузки
      };
    });
  };

  // Отображаем изображение на canvas
  const renderImage = () => {
    const [canvas, ctx] = getCanvasNCtx(canvasRef); // Получаем canvas и его контекст
    const imgPromise = imageUriToImgPromise(loadedImage.imageUri); // Загружаем изображение
    imgPromise.then((img) => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Рисуем изображение на canvas
    });
  };

  // Полное отображение изображения с учетом родительского контейнера
  const renderImageFull = (img: HTMLImageElement) => {
    const [canvas, _] = getCanvasNCtx(canvasRef); // Получаем canvas и его контекст

    const maxWidth = canvas.parentElement!.clientWidth; // Максимальная ширина контейнера
    const maxHeight = canvas.parentElement!.clientHeight; // Максимальная высота контейнера

    const scale = Math.min(maxWidth / img.width, maxHeight / img.height); // Вычисляем масштаб для пропорционального вписывания

    canvas.width = img.width * scale; // Устанавливаем ширину canvas
    canvas.height = img.height * scale; // Устанавливаем высоту canvas

    setImageScale(Math.floor(scale * 100)); // Обновляем состояние масштаба
    renderImage(); // Рисуем изображение
  };

  // Изменение масштаба изображения при слайдере
  const changeImageScale = (scale: number) => {
    const [canvas, _] = getCanvasNCtx(canvasRef); // Получаем canvas и контекст
    const scaleMultiplier = scale / 100; // Масштабный коэффициент

    const imgPromise = imageUriToImgPromise(loadedImage.imageUri); // Загружаем изображение
    imgPromise.then((img) => {
      canvas.width = img.width * scaleMultiplier; // Изменяем ширину
      canvas.height = img.height * scaleMultiplier; // Изменяем высоту
      renderImage(); // Рисуем изображение
    });
  };

  // Загружаем изображение из файла в canvas
  const uploadImageToCanvas = (file: File) => {
    setLoadedImage({
      ...loadedImage,
      imageUri: URL.createObjectURL(file), // Преобразуем файл в URI
    });
  };

  // Получение информации о пикселе по координатам мыши
  const getPixelInfo = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [_, ctx] = getCanvasNCtx(canvasRef); // Получаем canvas и контекст
    const mouseX = e.nativeEvent.offsetX; // Координата X мыши
    const mouseY = e.nativeEvent.offsetY; // Координата Y мыши
    const p = ctx.getImageData(mouseX, mouseY, 1, 1).data; // Получаем данные о пикселе (цвет)
    return {
      p: p, // RGB значения пикселя
      x: mouseX, // Координата X
      y: mouseY, // Координата Y
    };
  };

  // Обновляем информацию о пикселе при движении мыши
  const pixelInfoChange = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { p, x, y } = getPixelInfo(e); // Получаем данные о пикселе
    setPixelInfo({ rgb: [p[0], p[1], p[2]], x: x, y: y }); // Устанавливаем RGB и координаты
  };

  // Изменение цвета через инструмент "Пипетка"
  
  const colorChange = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 1) return; // Если инструмент "пипетка" не активен, выходим из функции
    const { p, x, y } = getPixelInfo(e); // Получаем данные о пикселе (цвет и координаты)
    
    // Если зажата клавиша Ctrl, то изменяем второй цвет (color2)
    if (e.ctrlKey) {
      return setColor2({ 
        rgb: [p[0], p[1], p[2]], // Устанавливаем RGB цвет для второго цвета
        x: x, // Устанавливаем координаты X
        y: y, // Устанавливаем координаты Y
      });
    }

    // В противном случае изменяем первый цвет (color1)
    return setColor1({ 
      rgb: [p[0], p[1], p[2]], // Устанавливаем RGB цвет для первого цвета
      x: x, // Устанавливаем координаты X
      y: y, // Устанавливаем координаты Y
    });
  };

  // Функция для обработки изменения масштаба через слайдер
  const onSliderChange = (scale: number) => {
    setImageScale(scale); // Обновляем состояние масштаба
  };

  // Изменение активного инструмента (рука или пипетка)
  const onCurrentToolChange = (id: number) => {
    setCurrentTool(id); // Устанавливаем текущий инструмент по его ID (0 - рука, 1 - пипетка)
  };

  // Изменение размера изображения
  const resizeImage = (newWidth: number, newHeight: number) => {
    const [canvas, ctx] = getCanvasNCtx(canvasRef); // Получаем canvas и контекст
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Получаем данные изображения
    const newData = getNewDataNearestNeighbour(imageData, newWidth, newHeight); // Изменяем размер изображения методом ближайшего соседа
    setLoadedImage({ ...loadedImage, imageUri: newData }); // Обновляем URI изображения с новыми размерами
  };

  // Функция для скачивания отредактированного изображения
  const downloadImage = () => {
    const canvas = canvasRef.current; // Получаем текущий canvas
    if (!canvas) return; // Если canvas не найден, выходим из функции
    const ctx = canvas.getContext('2d'); // Получаем контекст 2D для рисования
    const img = new Image(); // Создаем объект изображения
    img.src = loadedImage.imageUri; // Устанавливаем источник изображения
    img.onload = () => {
      canvas.width = img.width; // Устанавливаем ширину canvas в соответствии с изображением
      canvas.height = img.height; // Устанавливаем высоту canvas
      ctx?.drawImage(img, 0, 0); // Рисуем изображение на canvas
      const link = document.createElement('a'); // Создаем элемент ссылки для скачивания
      link.href = canvas.toDataURL('image/png'); // Преобразуем canvas в формат PNG
      link.download = 'edited-image.png'; // Название файла для скачивания
      link.click(); // Кликаем на ссылку для автоматического скачивания
    };
  };

  // Функция для открытия модального окна
  const openModal = (title: string, content: React.ReactNode) => {
    setModal({
      ...modal, // Сохраняем предыдущее состояние модального окна
      show: true, // Показываем модальное окно
      title: title, // Устанавливаем заголовок
      content: content, // Устанавливаем содержимое
    });
  };

  // Функция для обработки перемещения изображения при зажатой мыши
  const onImgViewMouseMove = (e: React.MouseEvent) => {
    if (currentTool !== 0) return; // Перемещение доступно только для инструмента "Рука"
    e.preventDefault();

    if (!dragRef.current.drag || !imgViewRef.current) return; // Проверка, что перемещение активно
    const imgView = imgViewRef.current;

    const x = e.pageX - dragRef.current.startX; // Вычисляем смещение по X
    const y = e.pageY - dragRef.current.startY; // Вычисляем смещение по Y

    const walkX = x - dragRef.current.scrollX; // Рассчитываем изменение по X
    const walkY = y - dragRef.current.scrollY; // Рассчитываем изменение по Y

    imgView.scrollLeft = Math.max(0, dragRef.current.scrollX - walkX); // Прокручиваем изображение влево
    imgView.scrollTop = Math.max(0, dragRef.current.scrollY - walkY); // Прокручиваем изображение вверх
  };

  // Функция для обработки начала перемещения изображения
  const onImgViewMouseDown = (e: React.MouseEvent) => {
    if (currentTool !== 0) return; // Перемещение доступно только для "Руки"
    const imgView = e.target as HTMLDivElement;
    dragRef.current = {
      ...dragRef.current, // Сохраняем текущее состояние
      drag: true, // Включаем режим перетаскивания
      startX: e.pageX - imgView.offsetLeft, // Устанавливаем начальное положение по X
      startY: e.pageY - imgView.offsetTop, // Устанавливаем начальное положение по Y
      scrollX: imgView.scrollLeft, // Сохраняем начальный скролл по X
      scrollY: imgView.scrollTop, // Сохраняем начальный скролл по Y
    };
    imgViewRef.current!.style.cursor = "grabbing"; // Изменяем курсор на "перетаскивание"
  };

  // Функция для остановки перемещения изображения
  const onImgViewMouseUp = () => {
    dragRef.current.drag = false; // Выключаем режим перетаскивания
    if (currentTool === 0) {
      imgViewRef.current!.style.cursor = "grab"; // Восстанавливаем курсор "перемещения"
    } else {
      imgViewRef.current!.style.cursor = "auto"; // Иначе ставим стандартный курсор
    }
  };

  // Обработка нажатий клавиш для перемещения изображения при активной "руке"
  const onKeyDown = (e: KeyboardEvent) => {
    if (currentTool !== 0) return; // Срабатывает только если активен инструмент "Рука"
    const imgView = imgViewRef.current;
    if (!imgView) return;

    const step = e.shiftKey ? 50 : 10; // Увеличиваем шаг при зажатом Shift
    switch (e.key) {
      case 'ArrowUp':
        imgView.scrollTop -= step; // Прокручиваем вверх
        break;
      case 'ArrowDown':
        imgView.scrollTop += step; // Прокручиваем вниз
        break;
      case 'ArrowLeft':
        imgView.scrollLeft -= step; // Прокручиваем влево
        break;
      case 'ArrowRight':
        imgView.scrollLeft += step; // Прокручиваем вправо
        break;
    }
  };

  // Добавляем обработчики нажатия клавиш для перемещения
  useEffect(() => {
    if (currentTool === 0) {
      window.addEventListener('keydown', onKeyDown); // Активируем обработку при включенной "руке"
    } else {
      window.removeEventListener('keydown', onKeyDown); // Удаляем обработку, если инструмент другой
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown); // Удаляем обработчики при размонтировании компонента
    };
  }, [currentTool]);

  // Функция для изменения URI загруженного изображения
  const changeLoadedImage = (data: string) => {
    setLoadedImage({ ...loadedImage, imageUri: data }); // Обновляем URI изображения
  };

  // Закрытие модального окна
  const closeModal = () => {
    setModal({ ...modal, show: false }); // Закрываем модальное окно
  };

  return (
    <div className="container">
      <div className="app">
        {/* Панель меню с кнопками */}
        <div className="menu-panel">
          <div className="menu-btns">
            <Button className="upload" type="primary" onClick={() => openModal(
              "Загрузить изображение",
              <Tabs defaultActiveKey="1" items={tabsItemsOnFunc(uploadImageToCanvas)} />
            )}>
              Загрузить изображение
            </Button>
            <Button className="curves" type="primary" onClick={() => {
              setImageScale(100);
              openModal(
                "Коррекция градиента",
                <CurvesModal
                  imageRef={canvasRef}
                  onGammaCorrectionChange={(data) => changeLoadedImage(data)}
                  closeModal={closeModal}
                />
              )
            }}>
              Кривые
            </Button>
            <Button className="filtration" type="primary" onClick={() => {
              setImageScale(100); // Устанавливаем масштаб изображения в 100% перед открытием модального окна
              openModal(
                "Фильтрация", // Заголовок окна
                <FilterModal
                  imageRef={canvasRef} // Передаем ссылку на canvas
                  onFilterChange={(data) => changeLoadedImage(data)} // Изменение изображения после применения фильтра
                  closeModal={closeModal} // Функция закрытия модального окна
                />
              )
            }}>
              Фильтры
            </Button>
          </div>

          {/* Блок с инструментами */}
          <div className="tools">
            <Button className="download" type="primary" onClick={downloadImage}>
              Сохранить
            </Button>

            <Button className="change-size" type="primary" onClick={() => openModal(
              "Изменение размера", // Заголовок модального окна
              <ChangeSizeModal
                width={loadedImage.imageOriginalWidth} // Передаем текущую ширину изображения
                height={loadedImage.imageOriginalHeight} // Передаем текущую высоту изображения
                onChangeSizeSubmit={(width, height) => resizeImage(width, height)} // Изменение размера изображения
                closeModal={closeModal} // Закрытие модального окна
              />
            )}>
              Изменить размер
            </Button>

            {/* Инструмент "Рука" для перемещения изображения */}
            <IconButton
              active={currentTool === 0} // Проверяем, активен ли данный инструмент
              component={HandSvg} // Иконка руки
              hint="Инструмент для передвижения картинки"
              onIconButtonClick={() => onCurrentToolChange(0)} // Устанавливаем активный инструмент
            />

            {/* Инструмент "Пипетка" для выбора цвета с изображения */}
            <IconButton
              active={currentTool === 1} // Проверяем, активен ли инструмент "Пипетка"
              component={PipetteSvg} // Иконка пипетки
              hint={`Пипетка для извлечения цвета из изображения
            Выбор первого цвета: ЛКМ
            Выбор второго цвета: Ctrl + ЛКМ
          `}
              onIconButtonClick={() => onCurrentToolChange(1)} // Выбор инструмента "Пипетка"
            />
          </div>
        </div>

        {/* Рабочая панель для отображения изображения и инструментов */}
        <div className="work-panel">
          {currentTool === 0 // Если выбран инструмент "Рука"
            ?
            <div
              ref={imgViewRef} // Ссылка на блок с изображением
              className="img-view"
              onMouseDown={onImgViewMouseDown} // Обработчик начала перемещения
              onMouseMove={onImgViewMouseMove} // Обработчик перемещения
              onMouseUp={onImgViewMouseUp} // Обработчик окончания перемещения
            >
              <canvas
                ref={canvasRef} // Ссылка на canvas
                className='canvas'
                onMouseMove={pixelInfoChange} // Обработчик движения мыши для обновления информации о пикселе
                onClick={colorChange} // Обработчик клика мыши для выбора цвета пипеткой
              />
            </div>
            :
            <div
              ref={imgViewRef} // Ссылка на блок с изображением
              className="img-view"
            >
              <canvas
                ref={canvasRef} // Ссылка на canvas
                className='canvas'
                onMouseMove={pixelInfoChange} // Обработчик движения мыши для пипетки
                onClick={colorChange} // Обработчик клика мыши для выбора цвета пипеткой
              />
              <SidePanel
                color1={color1} // Передаем первый цвет в панель инструментов
                color2={color2} // Передаем второй цвет в панель инструментов
                currentTool={currentTool} // Передаем текущий активный инструмент
              />
            </div>
          }
          <Footer
            loadedImage={loadedImage} // Информация о загруженном изображении
            pixelInfo={pixelInfo} // Информация о текущем пикселе
            color1={color1} // Первый выбранный цвет
            color2={color2} // Второй выбранный цвет
            scale={scale} // Текущий масштаб изображения
            currentTool={currentTool} // Текущий активный инструмент
            onCurrentToolChange={onCurrentToolChange} // Функция для изменения текущего инструмента
            onSliderChange={onSliderChange} // Функция для изменения масштаба через слайдер
          />
        </div>
      </div>

      {/* Модальное окно, которое используется для различных действий */}
      <Modal
        title={modal.title} // Заголовок модального окна
        open={modal.show} // Флаг отображения окна
        onCancel={closeModal} // Обработчик закрытия модального окна
        footer={[]} // Без кнопок футера в модальном окне
      >
        {modal.content} {/* Контент модального окна */}
      </Modal>
    </div>
  );
}

export default App;
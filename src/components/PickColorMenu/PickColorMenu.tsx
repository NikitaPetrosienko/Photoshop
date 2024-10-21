import { Divider } from 'antd'; // Импорт компонента Divider из библиотеки Ant Design
import { PixelInfoI } from '../../App'; // Импорт интерфейса PixelInfoI из файла App
import { rgbToXyz, rgbToLab, contrastCalc } from '../../utils/conversionColors'; // Импорт утилит для работы с цветами: конвертация из RGB в XYZ, LAB и расчёт контраста
import './PickColorMenu.css'; // Импорт стилей для компонента PickColorMenu
import { memo } from 'react'; // Импорт функции memo из React для оптимизации компонента

// Описание типов свойств, которые принимает компонент PickColorMenu
interface PickColorMenuProps {
  color1: PixelInfoI // Первый цвет (содержит RGB, координаты x и y)
  color2: PixelInfoI // Второй цвет (содержит RGB, координаты x и y)
}

// Определение компонента PickColorMenu с использованием memo для оптимизации (не перерендеривается при одинаковых пропсах)
const PickColorMenu = memo(function PickColorMenu({
  color1,
  color2,
}: PickColorMenuProps) {
  return (
    <div className='pick-color-menu'> {/* Основной контейнер для меню выбора цвета */}
      <div className="pick-color-info"> {/* Блок для отображения информации о первом цвете */}
        <div style={{ background: `rgb(${[...color1.rgb]})` }} className='pick-color' /> {/* Отображаем квадрат цвета с фоном, соответствующим первому цвету */}
        <div className="pick-colors"> {/* Блок с текстовой информацией о первом цвете */}
          <p>{ `RGB (${color1.rgb})` }</p> {/* Отображаем RGB-значения первого цвета */}
          <p>{ `XYZ (${rgbToXyz(color1.rgb)})` }</p> {/* Отображаем преобразование RGB в цветовую модель XYZ */}
          <p>{ `LAB (${rgbToLab(color1.rgb)})` }</p> {/* Отображаем преобразование RGB в цветовую модель LAB */}
        </div>
      </div>
      <p>{ `X: ${color1.x}; Y: ${color1.y}` }</p> {/* Отображаем координаты первого цвета */}
      <Divider /> {/* Разделитель между блоками */}
      
      <div className="pick-color-info"> {/* Блок для отображения информации о втором цвете */}
        <div style={{ background: `rgb(${[...color2.rgb]})` }} className='pick-color' /> {/* Отображаем квадрат цвета с фоном, соответствующим второму цвету */}
        <div className="pick-colors"> {/* Блок с текстовой информацией о втором цвете */}
          <p>{ `RGB (${color2.rgb})` }</p> {/* Отображаем RGB-значения второго цвета */}
          <p>{ `XYZ (${color2.rgb})` }</p> {/* Отображаем преобразование RGB в цветовую модель XYZ */}
          <p>{ `LAB (${color2.rgb})` }</p> {/* Отображаем преобразование RGB в цветовую модель LAB */}
        </div>
      </div>
      <p>{ `X: ${color2.x}; Y: ${color2.y}` }</p> {/* Отображаем координаты второго цвета */}
      <Divider /> {/* Разделитель между блоками */}
      
      {/* Отображаем контрастность между двумя цветами, вычисляем через функцию contrastCalc */}
      <p>Контрастность { contrastCalc(color1.rgb, color2.rgb).scale }</p>
      {/* Условно выводим текст о том, контрастны ли цвета или нет, в зависимости от результата contrastCalc */}
      { contrastCalc(color1.rgb, color2.rgb).isContrast 
        ? <p>Цвета контрастны</p> // Если контрастность достаточна, выводим текст "Цвета контрастны"
        : <p>Цвета не контрастны</p> // Если контрастности недостаточно, выводим текст "Цвета не контрастны"
      }
    </div>
  )
});

export default PickColorMenu; // Экспортируем компонент PickColorMenu для использования в других частях приложения
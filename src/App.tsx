import React, { useEffect, useRef, useState } from 'react';
import { Tabs, Modal, Button } from 'antd';
import {SidePanel} from "./components/SidePanel/SidePanel";
import ChangeSizeModal from './components/ChangeSizeModal/ChangeSizeModal';
import tabsItemsOnFunc from './utils/tabsItemsOnFunc';
import getNewDataNearestNeighbour from './utils/getNewDataNearestNeighbour';
import Footer from './components/Footer/Footer';
import CurvesModal from './components/CurvesModal/CurvesModal';
import FilterModal from './components/FilterModal/FilterModal';
import getCanvasNCtx from './utils/getCanvasNCtx';
import './App.css'
import IconButton from "./components/IconButton/IconButton";
import {ReactComponent as HandSvg} from "./assets/hand.svg";
import {ReactComponent as PipetteSvg} from "./assets/pipette.svg";

export interface LoadedImageI {
  imageUri: string
  imageOriginalWidth: number
  imageOriginalHeight: number
}

export interface PixelInfoI {
  rgb: [number, number, number]
  x: number
  y: number
}

interface ModalI {
  show: boolean
  title: string
  content: React.ReactNode
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgViewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    drag: false,
    startX: 0,
    startY: 0,
    scrollX: 0,
    scrollY: 0,
  })
  const [loadedImage, setLoadedImage] = useState<LoadedImageI>({
    imageUri: '',
    imageOriginalWidth: 0,
    imageOriginalHeight: 0
  });
  const [scale, setImageScale] = useState(100);
  const [pixelInfo, setPixelInfo] = useState<PixelInfoI>({
    rgb: [0, 0, 0],
    x: 0,
    y: 0,
  });
  const [modal, setModal] = useState<ModalI>({
    show: false,
    title: '',
    content: null,
  });
  const [currentTool, setCurrentTool] = useState(0);
  const [color1, setColor1] = useState<PixelInfoI>({
    rgb: [0, 0, 0],
    x: 0,
    y: 0
  });
  const [color2, setColor2] = useState<PixelInfoI>({
    rgb: [0, 0, 0],
    x: 0,
    y: 0
  });

  useEffect(() => {
    const imgPromise = imageUriToImgPromise(loadedImage.imageUri);
    imgPromise.then((img) => {
      renderImageFull(img);
      setLoadedImage({
        ...loadedImage,
        imageOriginalWidth: img.naturalWidth, 
        imageOriginalHeight: img.naturalHeight}
      );
    })
  }, [loadedImage.imageUri])

  useEffect(() => {
    changeImageScale(scale);
  }, [scale])

  const imageUriToImgPromise = (uri: string): Promise<HTMLImageElement> => {
    return new Promise(function (resolve, _) {
      const img = new Image()
      img.src = uri;
      img.onload = () => {
        resolve(img);
      };
    });
  };

  const renderImage = () => {
    const [canvas, ctx] = getCanvasNCtx(canvasRef);
    const imgPromise = imageUriToImgPromise(loadedImage.imageUri);
    imgPromise.then((img) => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    });
  }

  const renderImageFull = (img: HTMLImageElement) => {
    const [canvas, _] = getCanvasNCtx(canvasRef);
    
    const maxWidth = canvas.parentElement!.clientWidth;
    const maxHeight = canvas.parentElement!.clientHeight;

    const scale = Math.min(
      maxWidth / img.width,
      maxHeight / img.height
    );

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    setImageScale(Math.floor(scale * 100));
    renderImage();
  }

  const changeImageScale = (scale: number) => {
    const [canvas, _] = getCanvasNCtx(canvasRef);
    
    const scaleMultiplyer = scale / 100; 

    const imgPromise = imageUriToImgPromise(loadedImage.imageUri);
    imgPromise.then((img) => {
      canvas.width = img.width * scaleMultiplyer;
      canvas.height = img.height * scaleMultiplyer;
      renderImage();
    })
  }

  const uploadImageToCanvas = (file: File) => {
    setLoadedImage({
      ...loadedImage,
      imageUri: URL.createObjectURL(file),
    })
  }

  const getPixelInfo = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [_, ctx] = getCanvasNCtx(canvasRef);
    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;
    const p = ctx.getImageData(mouseX, mouseY, 1, 1).data;
    return {
      p: p,
      x: mouseX,
      y: mouseY,
    }
  }

  const pixelInfoChange = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const {p, x, y} = getPixelInfo(e);
    setPixelInfo({ 
      rgb: [p[0], p[1], p[2]], 
      x: x, 
      y: y, 
    }) 
  }

  const colorChange = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 1) return;
    const {p, x, y} = getPixelInfo(e);
    if (e.ctrlKey) {
      return setColor2({ 
        rgb: [p[0], p[1], p[2]], 
        x: x, 
        y: y, 
      }) 
    }
    return setColor1({ 
      rgb: [p[0], p[1], p[2]], 
      x: x, 
      y: y, 
    }) 
  }

  const onSliderChange = (scale: number) => {
    setImageScale(scale);
  }

  const onCurrentToolChange = (id: number) => {
    setCurrentTool(id);
  }

  const resizeImage =(newWidth: number, newHeight: number) => {
    const [canvas, ctx] = getCanvasNCtx(canvasRef);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newData = getNewDataNearestNeighbour(imageData, newWidth, newHeight);
    setLoadedImage({...loadedImage, imageUri: newData})
  };


  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = loadedImage.imageUri;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'edited-image.png';
      link.click();
    };
  };

  const openModal = (
    title: string,
    content: React.ReactNode
  ) => {
    return setModal({
      ...modal,
      show: true,
      title: title,
      content: content
    })
  };

  const onImgViewMouseDown = (e: React.MouseEvent) => {
    const imgView = e.target as HTMLDivElement;
    dragRef.current = {
      ...dragRef.current,
      drag: true,
      startX: e.pageX - imgView.offsetLeft,
      startY: e.pageY - imgView.offsetTop,
    };
    imgViewRef.current!!.style.cursor = "grabbing";
  };

  const onImgViewMouseUp = () => {
    dragRef.current.drag = false;
    imgViewRef.current!!.style.cursor = "auto";
  }

  const onImgViewMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!dragRef.current.drag || !imgViewRef.current ) return;
    
    const maxScrollLeft = imgViewRef.current.scrollWidth - imgViewRef.current.clientWidth;
    const maxScrollTop = imgViewRef.current.scrollHeight - imgViewRef.current.clientHeight;

    const imgView = e.target as HTMLDivElement;
    const x = e.pageX - imgView.offsetLeft;
    const y = e.pageY - imgView.offsetTop;
    const walkX = (x - dragRef.current.startX) * 1;
    const walkY = (y - dragRef.current.startY) * 1;

    if ((imgViewRef.current.scrollLeft - walkX >= maxScrollLeft && maxScrollLeft !== 0) || (imgViewRef.current.scrollLeft - walkX < 0 && maxScrollLeft !== 0)) return
    if ((imgViewRef.current.scrollTop - walkY >= maxScrollTop && maxScrollTop !== 0) || (imgViewRef.current.scrollTop - walkY < 0  && maxScrollTop !== 0)) return
    
    imgViewRef.current.scrollLeft = dragRef.current.scrollX - walkX;
    dragRef.current.scrollX = dragRef.current.scrollX - walkX;
    dragRef.current.startX = x;
    
    imgViewRef.current.scrollTop = dragRef.current.scrollY - walkY;
    dragRef.current.scrollY = dragRef.current.scrollY - walkY;
    dragRef.current.startY = y;
  }

  const changeLoadedImage = (data: string) => {
    setLoadedImage({...loadedImage, imageUri: data});
  };

  const closeModal = () => {
    setModal({...modal, show: false});
  }

  return (
    <div className="container">
      <div className="app">
        <div className="menu-panel">
          <div className="menu-btns">
            <Button className="upload" type="primary" onClick={ () => openModal(
                "Загрузить изображение",
                <Tabs defaultActiveKey="1" items={ tabsItemsOnFunc(uploadImageToCanvas) } />
            )}>
              Загрузить изображение
            </Button>
            <Button className="curves" type="primary" onClick={ () => {
              setImageScale(100);
              openModal(
                  "Коррекция градиента",
                  <CurvesModal
                      imageRef={ canvasRef }
                      onGammaCorrectionChange={ (data) => changeLoadedImage(data) }
                      closeModal={closeModal}
                  />
              )
            }}>
              Кривые
            </Button>
            <Button className="filtration" type="primary" onClick={ () => {
              setImageScale(100);
              openModal(
                  "Фильтрация",
                  <FilterModal
                      imageRef={ canvasRef }
                      onFilterChange={ (data) => changeLoadedImage(data) }
                      closeModal={closeModal}
                  />
              )
            }}>
              Фильтры
            </Button>
          </div>
          <div className="tools">
            <Button className="download" type="primary" onClick={ downloadImage }>
              Сохранить
            </Button>
            <Button className="change-size" type="primary" onClick={ () => openModal(
                "Изменение размера",
                <ChangeSizeModal
                    width={ loadedImage.imageOriginalWidth }
                    height={ loadedImage.imageOriginalHeight }
                    onChangeSizeSubmit={ (width, height) => resizeImage(width, height) }
                    closeModal={closeModal}
                />
            )}>
              Изменить размер
            </Button>
            <IconButton
                active={ currentTool === 0 }
                component={ HandSvg }
                hint="Инструмент для передвижения картинки"
                onIconButtonClick={ () => onCurrentToolChange(0) }
            />
            <IconButton
                active={ currentTool === 1 }
                component={ PipetteSvg }
                hint={`Пипетка для извлечения цвета из изображения
            Выбор первого цвета: ЛКМ
            Выбор второго цвета: Ctrl + ЛКМ
          `}
                onIconButtonClick={ () => onCurrentToolChange(1) }
            />
          </div>
        </div>
        <div className="work-panel">
          { currentTool === 0
            ?
            <div
              ref={ imgViewRef }
              className="img-view"
              onMouseDown={ onImgViewMouseDown }
              onMouseMove={ onImgViewMouseMove }
              onMouseUp={ onImgViewMouseUp }
            >
              <canvas
                ref={ canvasRef }
                className='canvas'
                onMouseMove={ pixelInfoChange }
                onClick={ colorChange }
              />
            </div>
            :
            <div
              ref={ imgViewRef }
              className="img-view"
            >
              <canvas
                ref={ canvasRef }
                className='canvas'
                onMouseMove={ pixelInfoChange }
                onClick={ colorChange }
              />
              <SidePanel
                  color1={ color1 }
                  color2={ color2 }
                  currentTool={ currentTool }/>
            </div>
          }
          <Footer
            loadedImage={ loadedImage }
            pixelInfo={ pixelInfo }
            color1={ color1 }
            color2={ color2 }
            scale={ scale }
            currentTool={ currentTool }
            onCurrentToolChange={ onCurrentToolChange }
            onSliderChange={ onSliderChange }
          />
        </div>
      </div>
      <Modal
        title={ modal.title }
        open={ modal.show }
        onCancel={closeModal}
        footer={[]}
      >
        { modal.content }
      </Modal>
    </div>
  )
}

export default App

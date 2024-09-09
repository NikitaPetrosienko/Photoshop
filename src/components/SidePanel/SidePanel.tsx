import PickColorMenu from "../PickColorMenu/PickColorMenu";
import './SidePanel.css';
import { Collapse } from "antd";
import {PixelInfoI} from "../../App";


export interface SidePanelProps {
    currentTool: number,
    color1: PixelInfoI
    color2: PixelInfoI
}

export function SidePanel({ currentTool, color1, color2 }: SidePanelProps) {
    return (
        <div className='side-panel'>
            {currentTool === 1 &&
                <Collapse
                    collapsible="header"
                    bordered={false}
                    size='small'
                    defaultActiveKey={['1']}
                    items={[
                        {
                            key: '1',
                            label: 'Пипетка',
                            children: <PickColorMenu color1={color1} color2={color2} />,
                        },
                    ]}
                />
            }
        </div>
    );
}

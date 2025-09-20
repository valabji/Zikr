import Azkar from './Azkar.json';


let zikr = global.zikr
zikr = zikr != undefined ? JSON.parse(zikr) : Azkar

export default zikr
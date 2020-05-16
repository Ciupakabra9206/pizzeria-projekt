
import BaseWidget from './BaseWidget.js';
import utils from '../utils.js';
import {settings, select, rangeSlider} from '../settings.js';

class HourPicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, settings.hours.open);
  
    const thisWidget = this;
      
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.hourPicker.input);
    thisWidget.dom.output = thisWidget.dom.wrapper.querySelector(select.widgets.amount.hourPicker.output);

    thisWidget.initPlugin();
    thisWidget.value = thisWidget.dom.input.value;
  }

  initPlugin(){
    const thisWidget = this;

    rangeSlider.create(thisWidget.dom.input);

    thisWidget.dom.input.addEventListener('input', function(){
      thisWidget.value = thisWidget.dom.input.value;
    } );

  }
  parseValue(newValue){
    return utils.numberToHour(newValue);
  } 
      
  isValid(){
    return true;
  }
    
  renderValue(){
    const thisWidget = this;

    thisWidget.dom.output.innerHTML = thisWidget.value;   
  }
}
export default HourPicker;
import {templates, select} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

export class Booking{
    
  constructor(element){
    const thisBooking = this;
 
    thisBooking.render(element);
    thisBooking.initWidget();
  }
  render(element){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.appendChild(utils.createDOMFromHTML(generatedHTML));

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querrySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querrySelector(select.booking.hoursAmount);

  }
  initWidget(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
  }

}
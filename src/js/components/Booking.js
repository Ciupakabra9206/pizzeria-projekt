import {templates, select, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';



class Booking{
    
  constructor(element){
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidget();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this; 

    const startDateParams = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParams = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParams,
        endDateParams,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParams,
        endDateParams,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParams , 
      ],
    };

    const urls = {
      booking:       settings.db.url + '/' + settings.db.booking
                                     + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event 
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event 
                                     + '?' + params.eventsRepeat.join('&'),
    };
   
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])   
      .then(function(allResponse){
        const bookingsResponse = allResponse[0];
        const eventsCurrentResponse = allResponse[1];
        const eventsRepeatResponse = allResponse[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){  
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if (typeof thisBooking.booked[date][startHour] == 'undefined') {
        thisBooking.booked[date][startHour] = [];
      }

      thisBooking.booked[date][startHour].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined') {
      allAvailable = true;
    }
    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
    thisBooking.rangeSliderStyle();
  }

  sendOrder() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    thisBooking.hour = utils.numberToHour(thisBooking.hour);

    const payload = {
      date: thisBooking.date,
      hour: utils.numberToHour(thisBooking.hour),
      table: thisBooking.tableIsBooked,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
      starters: [],

    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) {
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      });    
  }

  rangeSliderStyle() {
    const thisBooking = this;
    const bookedTimeRange = thisBooking.booked[thisBooking.date];
    const rangeColors = [];

    thisBooking.dom.rangeSlider = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.slider);
    const slider = thisBooking.dom.rangeSlider;

    for (let bookedTime in bookedTimeRange) {
      const min = 12;
      const max = 24;
      const step = 0.5;
      const newValue = (((bookedTime - min) * 100) / (max - min)); 
      const nextValue = (((bookedTime - min ) + step ) * 100) / (max - min);

      if (bookedTime < max) {

        if (bookedTimeRange[bookedTime].length <=  1 ) {
          rangeColors.push ('/*' + bookedTime + '*/green ' + newValue + '%, green ' + nextValue + '%');
        } else if (bookedTimeRange[bookedTime].length === 2) {
          rangeColors.push ('/*' + bookedTime + '*/orange ' + newValue + '%, orange ' + nextValue + '% ');
        } else if (bookedTimeRange[bookedTime].length === 3) {
          rangeColors.push ('/*' + bookedTime + '*/red ' + newValue + '%, red ' + nextValue + '%');
        }
      }
    }
    rangeColors.sort();
    const pushedColors = rangeColors.join();
    slider.style.background = 'linear-gradient(to right, ' + pushedColors + ')';
  }

  render(element){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.appendChild(utils.createDOMFromHTML(generatedHTML));
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.amount.hourPicker.wrapper);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.amount.datePicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

  }
  initWidget(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('update', function(){
      thisBooking.updateDOM();
      thisBooking.sendOrder();
    });
  }
}

export default Booking;
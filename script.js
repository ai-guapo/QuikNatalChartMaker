class Demo {
  constructor() {
    this.form = document.querySelector('#form');
    this.nameInput = document.querySelector('#name-input');
    this.placeInput = document.querySelector('#place');
    this.dateInput = document.querySelector('#date');
    this.timeInput = document.querySelector('#time');
    this.houseSystemInput = document.querySelector('#house-system');
    this.downloadBtn = document.querySelector('#download-btn');
    this.chartSelect = document.querySelector('#chart-select');
    this.paperDiv = document.getElementById('paper');
    this.placeholderEl = document.getElementById('placeholder');
    this.bodiesDiv = document.getElementById('bodies');
    this.errorMessageEl = document.getElementById('error-message');
    this.nameErrorMessageEl = document.getElementById('name-error-message');
    this.clearCurrentChartCheckbox = document.getElementById('clear-current-chart-checkbox');
    this.wipeAllChartsCheckbox = document.getElementById('wipe-all-charts-checkbox');

    this.orbConjunctionInput = document.querySelector('#orb-conjunction');
    this.orbOppositionInput = document.querySelector('#orb-opposition');
    this.orbTrineInput = document.querySelector('#orb-trine');
    this.orbSquareInput = document.querySelector('#orb-square');
    this.orbSextileInput = document.querySelector('#orb-sextile');

    this.interpretationLink = document.querySelector('#interpretation-link');

    this.cities = [];
    this.useCustomSuggestions = true;

    this.chartSlots = {};
    this.currentChartSlot = '1';

    this.DEFAULT_ORBS = {
      'Conjunction': 10,
      'Opposition': 10,
      'Trine': 9,
      'Square': 9,
      'Sextile': 6
    };

    this.lastEphemerisResults = null;
    this.lastCusps = null;
    this.lastAscendant = null;

    if (!this.form) {
      console.error('Form element not found');
      this.displayError('Form not found');
      return;
    }

    this.placeInput.addEventListener('focus', () => {
      this.placeInput.value = '';
      this.clearError();
    });
    this.placeInput.addEventListener('input', () => this.clearError());
    this.dateInput.addEventListener('input', () => this.clearError());
    this.timeInput.addEventListener('input', () => this.clearError());
    this.nameInput.addEventListener('input', () => this.clearError('name'));

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadSvg());
    }

    this.chartSelect.addEventListener('change', () => this.switchChartSlot());

    if (this.clearCurrentChartCheckbox) {
      this.clearCurrentChartCheckbox.addEventListener('change', () => this.handleClearCurrentChart());
    }
    if (this.wipeAllChartsCheckbox) {
      this.wipeAllChartsCheckbox.addEventListener('change', () => this.handleWipeAllCharts());
    }
    if (this.interpretationLink) {
      this.interpretationLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showInterpretationPopup();
      });
    }

    this.loadCities().then(() => {
      console.log('Cities loaded:', this.cities.length);
      if (this.useCustomSuggestions) {
        this.setupCustomSuggestions();
      } else {
        this.populateSuggestions();
        this.placeInput.addEventListener('input', () => this.updateSuggestions());
      }
    }).catch(error => {
      console.error('Failed to load cities:', error);
      this.displayError('Failed to load cities data. Check console.');
    });

    this.handleSubmit = this.handleSubmit.bind(this);
    this.form.addEventListener('submit', this.handleSubmit);

    this.loadAllChartStates();
    this.loadChartState(this.currentChartSlot);
  }

  displayError(message, type = 'general') {
    if (type === 'name' && this.nameErrorMessageEl) {
      this.nameErrorMessageEl.innerHTML = message;
      this.nameErrorMessageEl.style.display = 'block';
    } else if (this.errorMessageEl) {
      this.errorMessageEl.innerHTML = message;
      this.errorMessageEl.style.display = 'block';
    }
  }

  clearError(type = 'general') {
    if (type === 'name' && this.nameErrorMessageEl) {
      this.nameErrorMessageEl.innerHTML = '';
      this.nameErrorMessageEl.style.display = 'none';
    } else if (this.errorMessageEl) {
      this.errorMessageEl.innerHTML = '';
      this.errorMessageEl.style.display = 'none';
    }
  }

  async loadCities() {
    try {
      const response = await fetch('../lib/cities.json');
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      this.cities = await response.json();
      if (!Array.isArray(this.cities) || this.cities.length == 0) {
        throw new Error('Invalid or empty cities data');
      }
    } catch (error) {
      throw new Error(`Failed to load cities.json: ${error.message}`);
    }
  }

  populateSuggestions() {
    const datalist = document.querySelector('#place-suggestions');
    datalist.innerHTML = '';
    const sampleCities = this.cities.slice(0, 100);
    sampleCities.forEach(city => {
      const option = document.createElement('option');
      option.value = `${city.name}, ${city.country}`;
      datalist.appendChild(option);
    });
    console.log('Populated datalist with', sampleCities.length, 'cities');
  }

  updateSuggestions() {
    const input = this.placeInput.value.trim().toLowerCase();
    const datalist = document.querySelector('#place-suggestions');
    datalist.innerHTML = '';
    const matches = this.cities
      .filter(city => `${city.name}, ${city.country}`.toLowerCase().includes(input))
      .slice(0, 10);
    matches.forEach(city => {
      const option = document.createElement('option');
      option.value = `${city.name}, ${city.country}`;
      datalist.appendChild(option);
    });
    console.log('Updated suggestions:', matches.map(c => `${c.name}, ${c.country}`));
  }

  setupCustomSuggestions() {
    this.placeInput.addEventListener('input', () => this.showCustomSuggestions());
    this.placeInput.addEventListener('blur', () => {
      setTimeout(() => {
        const suggestions = document.querySelector('#suggestions');
        suggestions.style.display = 'none';
      }, 200);
    });
  }

  showCustomSuggestions() {
    const input = this.placeInput.value.trim().toLowerCase();
    const suggestionsDiv = document.querySelector('#suggestions');
    suggestionsDiv.innerHTML = '';
    if (!input) {
      suggestionsDiv.style.display = 'none';
      return;
    }
    const matches = this.cities
      .filter(city => `${city.name}, ${city.country}`.toLowerCase().includes(input))
      .slice(0, 10);
    if (matches.length == 0) {
      suggestionsDiv.style.display = 'none';
      return;
    }
    matches.forEach(city => {
      const div = document.createElement('div');
      div.textContent = `${city.name}, ${city.country}`;
      div.addEventListener('click', () => {
        this.placeInput.value = div.textContent;
        suggestionsDiv.style.display = 'none';
      });
      suggestionsDiv.appendChild(div);
    });
    suggestionsDiv.style.display = 'block';
    console.log('Custom suggestions:', matches.map(c => `${c.name}, ${c.country}`));
  }

  getCityCoordinates(place) {
    console.log('Searching for place:', place);
    const city = this.cities.find(c =>
      `${c.name}, ${c.country}`.toLowerCase().trim() == place.toLowerCase().trim()
    );
    if (!city) {
      console.error('Place not found in cities:', place);
      throw new Error('Invalid place selected. Please select from suggestions or enter a valid city and country.');
    }
    console.log('Found city:', city);
    return { latitude: city.lat, longitude: city.lng };
  }

  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  toDegrees(radians) {
    return radians * 180 / Math.PI;
  }

  normalizeAngle(degrees) {
    return (degrees % 360 + 360) % 360;
  }

  calculateJulianDate(year, month, day, hours, minutes, seconds) {
    const d = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    return d.getTime() / 86400000 + 2440587.5;
  }

  calculateSiderealTime(jd, longitude) {
    const T = (jd - 2451545.0) / 36525;
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
    gmst = this.normalizeAngle(gmst);
    const lst = gmst + longitude; // Simplified: longitude is already in degrees for LST calculation
    return this.normalizeAngle(lst);
  }

  calculateAscendantMc(latitude, lst, obliquity = 23.44) {
    const latRad = this.toRadians(latitude);
    const lstRad = this.toRadians(lst);
    const epsRad = this.toRadians(obliquity);

    const asc = Math.atan2(
      -Math.cos(lstRad),
      Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad)
    );
    let ascendant = this.toDegrees(asc);
    if (Math.sin(lstRad) < 0) ascendant += 180;
    else if (Math.cos(lstRad) > 0 && latitude < 0) ascendant += 360; // Condition for Southern Hemisphere adjustment
    ascendant = this.normalizeAngle(ascendant);

    const mc = Math.atan2(
      Math.tan(lstRad),
      Math.cos(epsRad)
    );
    let midheaven = this.toDegrees(mc);
    if (Math.cos(lstRad) < 0) midheaven += 180;
    midheaven = this.normalizeAngle(midheaven);

    return { ascendant, midheaven };
  }

  getZodiacSign(longitude) {
    const signs = [
      { name: 'Aries', symbol: '♈' }, { name: 'Taurus', symbol: '♉' },
      { name: 'Gemini', symbol: '♊' }, { name: 'Cancer', symbol: '♋' },
      { name: 'Leo', symbol: '♌' }, { name: 'Virgo', symbol: '♍' },
      { name: 'Libra', symbol: '♎' }, { name: 'Scorpio', symbol: '♏' },
      { name: 'Sagittarius', symbol: '♐' }, { name: 'Capricorn', symbol: '♑' },
      { name: 'Aquarius', symbol: '♒' }, { name: 'Pisces', symbol: '♓' }
    ];
    const index = Math.floor(this.normalizeAngle(longitude) / 30);
    return signs[index];
  }

  degreesToDMS(degrees) {
    const deg = Math.floor(degrees);
    const minFloat = (degrees - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.round((minFloat - min) * 60);
    return `${deg}°${min}'${sec}"`;
  }

  calculateEqualCusps(ascendant) {
    const cusps = new Array(12);
    for (let i = 0; i < 12; i++) {
      cusps[i] = this.normalizeAngle(ascendant + i * 30);
    }
    return cusps;
  }

  calculateWholeCusps(ascendant) {
    const signStart = Math.floor(ascendant / 30) * 30;
    const cusps = new Array(12);
    for (let i = 0; i < 12; i++) {
      cusps[i] = this.normalizeAngle(signStart + i * 30);
    }
    return cusps;
  }

  calculateTimezoneOffset(latitude, longitude, date, time) {
    if (!window.tzlookup || !window.moment) {
      console.error('Time zone libraries missing');
      throw new Error('Time zone libraries not loaded');
    }
    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.error('Invalid coordinates:', { latitude, longitude });
      throw new Error('Invalid coordinates');
    }
    const timezone = tzlookup(latitude, longitude);
    const datetime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone);
    if (!datetime.isValid()) {
      console.error('Invalid datetime:', `${date} ${time}`);
      throw new Error('Invalid date or time');
    }
    const offsetMinutes = datetime.utcOffset(); // moment.tz().utcOffset()
    const offsetHours = offsetMinutes / 60;
    const isDST = datetime.isDST(); // moment.tz().isDST()
    console.log(`Calculated offset: ${offsetHours} hours for ${date} ${time} in ${timezone} (DST: ${isDST})`);
    return { timezone, offsetHours, isDST };
  }

  downloadSvg() {
    try {
      const svg = this.paperDiv.querySelector('svg');
      if (!svg) {
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: #333; color: #fff; padding: 20px; border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 9999;
          font-family: 'Inter', sans-serif;
        `;
        messageBox.innerHTML = `
          <p>No chart available to download.</p>
          <button style="background: #9b59b6; color: #e0e0e0; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-top: 10px;">OK</button>
        `;
        document.body.appendChild(messageBox);
        messageBox.querySelector('button').addEventListener('click', () => {
          document.body.removeChild(messageBox);
        });
        return;
      }

      const serializer = new XMLSerializer();
      const svgString = '<?xml version="1.0" standalone="no"?>\n' + serializer.serializeToString(svg);

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `natal_chart_${this.nameInput.value.replace(/[^a-zA-Z0-9]/g, '_') || this.currentChartSlot}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('SVG download triggered');
    } catch (error) {
      console.error('Error downloading SVG:', error);
      const messageBox = document.createElement('div');
      messageBox.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #333; color: #fff; padding: 20px; border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 9999;
        font-family: 'Inter', sans-serif;
      `;
      messageBox.innerHTML = `
        <p>Failed to download chart. Check console for details.</p>
        <button style="background: #9b59b6; color: #e0e0e0; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-top: 10px;">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').addEventListener('click', () => {
        document.body.removeChild(messageBox);
      });
    }
  }

  loadAllChartStates() {
    try {
      const storedData = localStorage.getItem('natalChartData');
      if (storedData) {
        this.chartSlots = JSON.parse(storedData);
        for (let i = 1; i <= 10; i++) {
          const slotId = String(i);
          if (this.chartSlots[slotId] && this.chartSlots[slotId].name) {
            this.updateChartSelectOption(slotId, this.chartSlots[slotId].name);
          } else {
            this.updateChartSelectOption(slotId, '');
          }
        }
      }
    } catch (e) {
      console.error("Error loading chart data from localStorage:", e);
      localStorage.removeItem('natalChartData');
    }
  }

  saveChartState(slotId) {
    console.log(`Saving state for Chart ${slotId}`);
    const customOrbs = {
      'Conjunction': parseInt(this.orbConjunctionInput.value),
      'Opposition': parseInt(this.orbOppositionInput.value),
      'Trine': parseInt(this.orbTrineInput.value),
      'Square': parseInt(this.orbSquareInput.value),
      'Sextile': parseInt(this.orbSextileInput.value)
    };

    const currentChartData = {
      name: this.nameInput.value,
      place: this.placeInput.value,
      date: this.dateInput.value,
      time: this.timeInput.value,
      houseSystem: this.houseSystemInput.value,
      svgContent: this.paperDiv.innerHTML,
      tablesContent: this.bodiesDiv.innerHTML,
      customOrbs: customOrbs,
      interpretationLinkVisible: this.interpretationLink.style.display === 'block',
      lastEphemerisResults: this.lastEphemerisResults,
      lastCusps: this.lastCusps,
      lastAscendant: this.lastAscendant
    };
    this.chartSlots[slotId] = currentChartData;
    localStorage.setItem('natalChartData', JSON.stringify(this.chartSlots));
  }

  loadChartState(slotId) {
    console.log(`Loading state for Chart ${slotId}`);
    this.clearFormAndDisplay(false, false);

    const savedChartData = this.chartSlots[slotId];
    if (savedChartData) {
      this.nameInput.value = savedChartData.name || '';
      this.placeInput.value = savedChartData.place || '';
      this.dateInput.value = savedChartData.date || '';
      this.timeInput.value = savedChartData.time || '';
      this.houseSystemInput.value = savedChartData.houseSystem || 'Equal';

      if (savedChartData.customOrbs) {
        this.orbConjunctionInput.value = savedChartData.customOrbs['Conjunction'] || this.DEFAULT_ORBS['Conjunction'];
        this.orbOppositionInput.value = savedChartData.customOrbs['Opposition'] || this.DEFAULT_ORBS['Opposition'];
        this.orbTrineInput.value = savedChartData.customOrbs['Trine'] || this.DEFAULT_ORBS['Trine'];
        this.orbSquareInput.value = savedChartData.customOrbs['Square'] || this.DEFAULT_ORBS['Square'];
        this.orbSextileInput.value = savedChartData.customOrbs['Sextile'] || this.DEFAULT_ORBS['Sextile'];
      } else {
        this.resetOrbInputsToDefaults();
      }

      this.paperDiv.innerHTML = savedChartData.svgContent || '';
      this.bodiesDiv.innerHTML = savedChartData.tablesContent || '';

      if (this.paperDiv.querySelector('svg')) {
        this.placeholderEl.style.display = 'none';
        this.downloadBtn.style.display = 'block';
      } else {
        this.placeholderEl.style.display = 'block';
        this.downloadBtn.style.display = 'none';
      }
      this.interpretationLink.style.display = savedChartData.interpretationLinkVisible ? 'block' : 'none';

      this.lastEphemerisResults = savedChartData.lastEphemerisResults || null;
      this.lastCusps = savedChartData.lastCusps || null;
      this.lastAscendant = savedChartData.lastAscendant !== undefined ? savedChartData.lastAscendant : null;

      console.log(`Chart ${slotId} loaded successfully.`);
    } else {
      console.log(`No saved data for Chart ${slotId}. Displaying default state.`);
      this.resetOrbInputsToDefaults();
      this.interpretationLink.style.display = 'none';
      this.lastEphemerisResults = null;
      this.lastCusps = null;
      this.lastAscendant = null;
    }
    this.chartSelect.value = slotId;
  }

  resetOrbInputsToDefaults() {
    this.orbConjunctionInput.value = this.DEFAULT_ORBS['Conjunction'];
    this.orbOppositionInput.value = this.DEFAULT_ORBS['Opposition'];
    this.orbTrineInput.value = this.DEFAULT_ORBS['Trine'];
    this.orbSquareInput.value = this.DEFAULT_ORBS['Square'];
    this.orbSextileInput.value = this.DEFAULT_ORBS['Sextile'];
  }

  clearFormAndDisplay(resetDropdownText = true, clearFormInputs = true) {
    if (clearFormInputs) {
      this.nameInput.value = '';
      this.placeInput.value = '';
      this.dateInput.value = '';
      this.timeInput.value = '';
      this.houseSystemInput.value = 'Equal';
      this.resetOrbInputsToDefaults();
    }

    this.paperDiv.innerHTML = '';
    this.paperDiv.appendChild(this.placeholderEl);
    this.placeholderEl.style.display = 'block';
    this.paperDiv.appendChild(this.downloadBtn);
    this.downloadBtn.style.display = 'none';
    this.interpretationLink.style.display = 'none';

    this.bodiesDiv.innerHTML = `
      <table>
        <thead>
          <tr>
            <th></th><th>Sun</th><th>Moon</th><th>Mercury</th><th>Venus</th><th>Mars</th>
            <th>Jupiter</th><th>Saturn</th><th>Uranus</th><th>Neptune</th><th>Pluto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Degrees</td><td id="sun-dms"></td><td id="moon-dms"></td><td id="mercury-dms"></td>
            <td id="venus-dms"></td><td id="mars-dms"></td><td id="jupiter-dms"></td>
            <td id="saturn-dms"></td><td id="uranus-dms"></td><td id="neptune-dms"></td><td id="pluto-dms"></td>
          </tr>
          <tr>
            <td>Zodiac Sign</td><td id="sun-sign"></td><td id="moon-sign"></td><td id="mercury-sign"></td>
            <td id="venus-sign"></td><td id="mars-sign"></td><td id="jupiter-sign"></td>
            <td id="saturn-sign"></td><td id="uranus-sign"></td><td id="neptune-sign"></td><td id="pluto-sign"></td>
          </tr>
          <tr>
            <td>Astro Symbol</td><td id="sun-symbol"></td><td id="moon-symbol"></td><td id="mercury-symbol"></td>
            <td id="venus-symbol"></td><td id="mars-symbol"></td><td id="jupiter-symbol"></td>
            <td id="saturn-symbol"></td><td id="uranus-symbol"></td><td id="neptune-symbol"></td><td id="pluto-symbol"></td>
          </tr>
          <tr>
            <td>Motion</td><td></td><td></td><td id="mercury-motion"></td><td id="venus-motion"></td>
            <td id="mars-motion"></td><td id="jupiter-motion"></td><td id="saturn-motion"></td>
            <td id="uranus-motion"></td><td id="neptune-motion"></td><td id="pluto-motion"></td>
          </tr>
          <tr class="divider"><td colspan="11"></td></tr>
          <tr class="moon-phase-row">
            <td>Moon Phase</td><td colspan="5" id="moon-direction"></td><td colspan="5" id="moon-shape"></td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th></th><th class="house-cusp-th">I</th><th class="house-cusp-th">II</th><th class="house-cusp-th">III</th>
            <th class="house-cusp-th">IV</th><th class="house-cusp-th">V</th><th class="house-cusp-th">VI</th>
            <th class="house-cusp-th">VII</th><th class="house-cusp-th">VIII</th><th class="house-cusp-th">IX</th>
            <th class="house-cusp-th">X</th><th class="house-cusp-th">XI</th><th class="house-cusp-th">XII</th>
          </tr>
        </thead>
        <tbody>
          <tr class="house-cusps-row">
            <td>House Cusps</td><td id="cusp-1" class="house-cusp-td"></td><td id="cusp-2" class="house-cusp-td"></td>
            <td id="cusp-3" class="house-cusp-td"></td><td id="cusp-4" class="house-cusp-td"></td>
            <td id="cusp-5" class="house-cusp-td"></td><td id="cusp-6" class="house-cusp-td"></td>
            <td id="cusp-7" class="house-cusp-td"></td><td id="cusp-8" class="house-cusp-td"></td>
            <td id="cusp-9" class="house-cusp-td"></td><td id="cusp-10" class="house-cusp-td"></td>
            <td id="cusp-11" class="house-cusp-td"></td><td id="cusp-12" class="house-cusp-td"></td>
          </tr>
          <tr class="divider"><td colspan="13"></td></tr>
          <tr class="four-angles-row">
            <td>The Four Angles</td><td id="angle-asc" class="four-angles-td" colspan="3"></td>
            <td id="angle-ds" class="four-angles-td" colspan="3"></td><td id="angle-mc" class="four-angles-td" colspan="3"></td>
            <td id="angle-ic" class="four-angles-td" colspan="3"></td>
          </tr>
        </tbody>
      </table>
      <table id="aspects-table">
        <thead>
          <tr><th colspan="6">Major Aspects</th></tr>
          <tr>
            <th>Planet 1</th><th>Degree/Sign</th><th>Aspect</th>
            <th>Planet 2</th><th>Degree/Sign</th><th>Orb</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>`;

    if (resetDropdownText) {
      this.updateChartSelectOption(this.currentChartSlot, '');
    }
  }

  switchChartSlot() {
    this.saveChartState(this.currentChartSlot);
    this.currentChartSlot = this.chartSelect.value;
    this.loadChartState(this.currentChartSlot);
  }

  updateChartSelectOption(slotId, name) {
    const option = this.chartSelect.querySelector(`option[value="${slotId}"]`);
    if (option) {
      option.textContent = `Chart ${slotId}: ${name || ''}`;
    }
  }

  handleClearCurrentChart() {
    if (this.clearCurrentChartCheckbox.checked) {
      console.log(`Clearing Chart ${this.currentChartSlot} data.`);
      delete this.chartSlots[this.currentChartSlot];
      localStorage.setItem('natalChartData', JSON.stringify(this.chartSlots));
      this.clearFormAndDisplay(true, true);
      this.updateChartSelectOption(this.currentChartSlot, '');
      this.lastEphemerisResults = null;
      this.lastCusps = null;
      this.lastAscendant = null;
      this.clearCurrentChartCheckbox.checked = false;
    }
  }

  handleWipeAllCharts() {
    if (this.wipeAllChartsCheckbox.checked) {
      const confirmBox = document.createElement('div');
      confirmBox.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #333; color: #fff; padding: 20px; border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 9999;
        font-family: 'Inter', sans-serif; text-align: center;
      `;
      confirmBox.innerHTML = `
        <p>Are you sure you want to wipe ALL chart slots? This action cannot be undone.</p>
        <button id="confirm-wipe" style="background: #ff6b6b; color: #e0e0e0; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Yes, Wipe All</button>
        <button id="cancel-wipe" style="background: #4a90e2; color: #e0e0e0; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">Cancel</button>
      `;
      document.body.appendChild(confirmBox);

      document.getElementById('confirm-wipe').addEventListener('click', () => {
        console.log('Wiping ALL chart slots data.');
        localStorage.removeItem('natalChartData');
        this.chartSlots = {};
        this.clearFormAndDisplay(true, true);
        this.lastEphemerisResults = null;
        this.lastCusps = null;
        this.lastAscendant = null;
        for (let i = 1; i <= 10; i++) {
          this.updateChartSelectOption(String(i), '');
        }
        this.chartSelect.value = '1';
        this.currentChartSlot = '1';
        this.loadChartState('1'); // Ensure UI reflects the cleared state for slot 1
        document.body.removeChild(confirmBox);
        this.wipeAllChartsCheckbox.checked = false;
      });

      document.getElementById('cancel-wipe').addEventListener('click', () => {
        console.log('Wipe ALL charts cancelled.');
        document.body.removeChild(confirmBox);
        this.wipeAllChartsCheckbox.checked = false;
      });
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    this.clearError();
    this.clearError('name');
    console.log('Form submitted');

    try {
      const name = this.nameInput.value.trim();
      if (!name) {
        this.displayError('Name is required.', 'name');
        return;
      }
      const place = this.placeInput.value.trim();
      if (!place) throw new Error('Place of birth is required.');
      const date = this.dateInput.value;
      if (!date) throw new Error('Date of birth is required.');
      const year = parseInt(date.split('-')[0]);
      if (year < 1900 || year > 2100) throw new Error('Date must be between 1900 and 2100.');
      const time = this.timeInput.value;
      if (!time || !/^[0-2][0-9]:[0-5][0-9]$/.test(time)) throw new Error('Valid time in HH:mm format is required (e.g., 04:20).');
      const houseSystem = this.houseSystemInput.value;
      if (!['Equal', 'Whole'].includes(houseSystem)) throw new Error('Invalid house system selected.');

      const { latitude, longitude } = this.getCityCoordinates(place);
      let utcTime, timezone, offsetHours, isDST;
      try {
        ({ timezone, offsetHours, isDST } = this.calculateTimezoneOffset(latitude, longitude, date, time));
        const datetime = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', timezone);
        if (datetime.isValid()) utcTime = datetime.utc().toDate();
        else throw new Error('Invalid datetime conversion for timezone calculation.');
      } catch (error) {
        console.warn(`Time zone calculation failed: ${error.message}. Using manual offset of 0 (UTC).`);
        timezone = 'UTC'; offsetHours = 0; isDST = false;
        const datetime = moment.utc(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
        if (datetime.isValid()) utcTime = datetime.toDate();
        else throw new Error('Invalid date or time for UTC fallback calculation.');
      }

      const origin = {
        year: utcTime.getUTCFullYear(), month: utcTime.getUTCMonth(), day: utcTime.getUTCDate(),
        hours: utcTime.getUTCHours(), minutes: utcTime.getUTCMinutes(), seconds: utcTime.getUTCSeconds(),
        latitude, longitude, houseSystem
      };
      console.log('Local Time:', `${date} ${time}`, 'Time Zone:', timezone, `Offset: ${offsetHours}h, DST: ${isDST}`);
      console.log('UTC Time:', utcTime.toISOString(), 'Origin:', origin);

      if (!window.Ephemeris || !window.Ephemeris.default) throw new Error('Ephemeris library not loaded.');
      const ephemeris = new Ephemeris.default({ ...origin });

      ephemeris.Results.forEach(result => {
        const validKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
        if (!validKeys.includes(result.key)) return;
        const degreeInSign = this.normalizeAngle(result.position.apparentLongitude) % 30;
        const dmsEl = document.querySelector(`#${result.key}-dms`);
        if (dmsEl) dmsEl.innerHTML = this.degreesToDMS(degreeInSign);
        const signEl = document.querySelector(`#${result.key}-sign`);
        const symbolEl = document.querySelector(`#${result.key}-symbol`);
        if (signEl && symbolEl) {
          const zodiac = this.getZodiacSign(result.position.apparentLongitude);
          signEl.innerHTML = zodiac.name;
          symbolEl.innerHTML = `<span class="astro-symbol">${zodiac.symbol}</span>`;
        }
        const retroEl = document.querySelector(`#${result.key}-motion`);
        if (retroEl && result.key !== 'sun' && result.key !== 'moon') {
          retroEl.innerHTML = result.motion.isRetrograde ? 'Retrograde' : 'Direct';
        }
      });

      const moonDirectionEl = document.querySelector('#moon-direction');
      const moonShapeEl = document.querySelector('#moon-shape');
      if (moonDirectionEl) moonDirectionEl.innerHTML = ephemeris.moon.position.shapeDirectionString || '';
      if (moonShapeEl) moonShapeEl.innerHTML = ephemeris.moon.position.shapeString || '';

      const jd = this.calculateJulianDate(origin.year, origin.month, origin.day, origin.hours, origin.minutes, origin.seconds);
      const lst = this.calculateSiderealTime(jd, origin.longitude);
      const { ascendant, midheaven } = this.calculateAscendantMc(origin.latitude, lst);

      let cusps;
      switch (origin.houseSystem) {
        case 'Equal': cusps = this.calculateEqualCusps(ascendant); break;
        case 'Whole': cusps = this.calculateWholeCusps(ascendant); break;
        default: throw new Error('Unknown house system');
      }
      console.log(`House Cusps (${origin.houseSystem}):`, cusps.map(c => c.toFixed(2)));
      console.log(`Calculated Ascendant: ${ascendant.toFixed(4)}°, Midheaven: ${midheaven.toFixed(4)}°`);

      const cuspsForTableDisplay = ascendant >= 180 ? cusps.map(c => this.normalizeAngle(c + 180)) : cusps;
      cuspsForTableDisplay.forEach((cusp, index) => {
        const cuspEl = document.querySelector(`#cusp-${index + 1}`);
        if (cuspEl) {
          const degreeInSign = this.normalizeAngle(cusp) % 30;
          const zodiac = this.getZodiacSign(cusp);
          cuspEl.innerHTML = `${this.degreesToDMS(degreeInSign)} ${zodiac.name}`;
        }
      });

      const ascEl = document.querySelector('#angle-asc');
      const dsEl = document.querySelector('#angle-ds');
      const mcEl = document.querySelector('#angle-mc');
      const icEl = document.querySelector('#angle-ic');
      if (ascEl && dsEl && mcEl && icEl) {
        const adjustedAscendantForDisplay = ascendant >= 180 ? this.normalizeAngle(ascendant + 180) : ascendant;
        const displayDescendant = this.normalizeAngle(adjustedAscendantForDisplay + 180);
        const displayMidheaven = midheaven; // MC does not use the same ascendant-based 180-degree flip logic
        const displayIC = this.normalizeAngle(displayMidheaven + 180);

        ascEl.innerHTML = `Ascendant ${this.degreesToDMS(this.normalizeAngle(adjustedAscendantForDisplay) % 30)} ${this.getZodiacSign(adjustedAscendantForDisplay).name}`;
        dsEl.innerHTML = `Descendant ${this.degreesToDMS(this.normalizeAngle(displayDescendant) % 30)} ${this.getZodiacSign(displayDescendant).name}`;
        mcEl.innerHTML = `MC ${this.degreesToDMS(this.normalizeAngle(displayMidheaven) % 30)} ${this.getZodiacSign(displayMidheaven).name}`;
        icEl.innerHTML = `IC ${this.degreesToDMS(this.normalizeAngle(displayIC) % 30)} ${this.getZodiacSign(displayIC).name}`;
      }

      const currentOrbs = {
        'Conjunction': parseInt(this.orbConjunctionInput.value),
        'Opposition': parseInt(this.orbOppositionInput.value),
        'Trine': parseInt(this.orbTrineInput.value),
        'Square': parseInt(this.orbSquareInput.value),
        'Sextile': parseInt(this.orbSextileInput.value)
      };

      this.lastEphemerisResults = ephemeris.Results;
      this.lastCusps = cusps;
      this.lastAscendant = ascendant;

      const aspects = this.calculateAspects(ephemeris.Results, currentOrbs);
      this.populateAspectsTable(aspects);

      const chartData = this.formatForAstroChart(ephemeris, cusps, ascendant, midheaven);
      this.renderAstroChart(chartData);

      this.saveChartState(this.currentChartSlot);
      this.updateChartSelectOption(this.currentChartSlot, name);
      this.interpretationLink.style.display = 'block';

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      this.displayError(`Error: ${error.message}`);
    }
  }

  formatForAstroChart(ephemeris, cusps, ascendant, midheaven) {
    const planetMap = {
      sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
      jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto'
    };
    const planets = {};
    ephemeris.Results.forEach(result => {
      if (planetMap[result.key]) {
        planets[planetMap[result.key]] = [this.normalizeAngle(result.position.apparentLongitude)];
      }
    });
    planets['NNode'] = [this.normalizeAngle(ephemeris.moon.orbit.meanAscendingNode?.apparentLongitude || 0)];

    // AstroChart expects cusps to be adjusted if the ascendant is >= 180 for its drawing logic.
    const adjustedCuspsForChart = ascendant >= 180 ? cusps.map(c => this.normalizeAngle(c + 180)) : cusps;
    
    return {
      planets,
      cusps: adjustedCuspsForChart, // Pass the cusps adjusted for AstroChart's drawing
      midheaven: midheaven, // MC for AstroChart
      ic: this.normalizeAngle(midheaven + 180) // IC for AstroChart
    };
  }

  renderAstroChart(data) { // Removed ascendant, midheaven params as they are in 'data'
    this.paperDiv.innerHTML = '';
    this.paperDiv.appendChild(this.downloadBtn);

    if (!window.astrology || !window.astrology.Chart) {
      console.error('AstroChart library not loaded');
      this.paperDiv.innerHTML = '<p>Error: AstroChart library not loaded.</p>';
      this.downloadBtn.style.display = 'none';
      return;
    }

    try {
      const radix = new astrology.Chart('paper', 600, 600).radix({
        planets: data.planets,
        cusps: data.cusps // data.cusps are already adjusted for AstroChart drawing
      });
      radix.addPointsOfInterest({ // AstroChart uses the provided cusps[0] as Ascendant for its drawing
        As: [data.cusps[0]],
        Ds: [data.cusps[6]], // Derived from the provided (possibly adjusted) cusps
        Mc: [data.midheaven],
        Ic: [data.ic]
      });
      radix.aspects();
      this.placeholderEl.style.display = 'none';
      this.downloadBtn.style.display = 'block';
      console.log('Chart rendered successfully');
    } catch (error) {
      console.error('Error rendering AstroChart:', error);
      this.paperDiv.innerHTML = '<p>Error rendering chart. Check console.</p>';
      this.downloadBtn.style.display = 'none';
      this.placeholderEl.style.display = 'none';
    }
  }

  calculateAspects(ephemerisResults, customOrbs) {
    const aspects = [];
    const majorAspects = [
      { name: 'Conjunction', degree: 0 }, { name: 'Sextile', degree: 60 },
      { name: 'Square', degree: 90 }, { name: 'Trine', degree: 120 },
      { name: 'Opposition', degree: 180 }
    ];
    const planets = ephemerisResults.filter(p =>
      ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(p.key)
    ).map(p => ({
      key: p.key,
      name: p.key.charAt(0).toUpperCase() + p.key.slice(1),
      longitude: this.normalizeAngle(p.position.apparentLongitude)
    }));

    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const p1 = planets[i];
        const p2 = planets[j];
        let angleDiff = Math.abs(p1.longitude - p2.longitude);
        angleDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;
        for (const aspectType of majorAspects) {
          const orb = customOrbs[aspectType.name] !== undefined ? customOrbs[aspectType.name] : this.DEFAULT_ORBS[aspectType.name];
          const diff = Math.abs(angleDiff - aspectType.degree);
          if (diff <= orb) {
            aspects.push({
              planet1: p1.name, planet1Longitude: p1.longitude,
              planet2: p2.name, planet2Longitude: p2.longitude,
              aspect: aspectType.name, orb: diff.toFixed(2)
            });
          }
        }
      }
    }
    return aspects;
  }

  populateAspectsTable(aspects) {
    const aspectsTableBody = document.querySelector('#aspects-table tbody');
    if (!aspectsTableBody) {
      console.error('Aspects table body not found.');
      return;
    }
    aspectsTableBody.innerHTML = '';
    if (aspects.length === 0) {
      const row = aspectsTableBody.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 6;
      cell.textContent = 'No major aspects found with current orb settings.';
      return;
    }
    aspects.forEach(aspect => {
      const row = aspectsTableBody.insertRow();
      row.insertCell(0).textContent = aspect.planet1;
      const p1DegreeInSign = this.normalizeAngle(aspect.planet1Longitude) % 30;
      const p1Zodiac = this.getZodiacSign(aspect.planet1Longitude);
      row.insertCell(1).innerHTML = `${this.degreesToDMS(p1DegreeInSign)} ${p1Zodiac.symbol}`;
      row.insertCell(2).textContent = aspect.aspect;
      row.insertCell(3).textContent = aspect.planet2;
      const p2DegreeInSign = this.normalizeAngle(aspect.planet2Longitude) % 30;
      const p2Zodiac = this.getZodiacSign(aspect.planet2Longitude);
      row.insertCell(4).innerHTML = `${this.degreesToDMS(p2DegreeInSign)} ${p2Zodiac.symbol}`;
      row.insertCell(5).textContent = `${aspect.orb}°`;
    });
  }

  getHouseForLongitude(longitude, cusps) {
    const normalizedLongitude = this.normalizeAngle(longitude);
    for (let i = 0; i < 12; i++) {
      const startCusp = cusps[i]; // Assumes cusps are already normalized
      const endCusp = cusps[(i + 1) % 12];
      if (startCusp <= endCusp) {
        if (normalizedLongitude >= startCusp && normalizedLongitude < endCusp) return i + 1;
      } else { // Wrap-around case
        if (normalizedLongitude >= startCusp || normalizedLongitude < endCusp) return i + 1;
      }
    }
    console.warn(`Planet at ${normalizedLongitude}° could not be placed in house with cusps: ${cusps.join(', ')}. Defaulting House 1.`);
    return 1;
  }

  getOrdinalSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
  }

  async showInterpretationPopup() {
    if (!this.lastEphemerisResults || !this.lastCusps || this.lastAscendant === null) {
      this.displayError('No chart data available for interpretation. Please generate a chart first.');
      return;
    }
    let interpretationsData;
    try {
      const response = await fetch('../lib/inter.json');
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      interpretationsData = await response.json();
    } catch (error) {
      console.error('Failed to load inter.json:', error);
      this.displayError('Failed to load interpretation data. Check console.');
      return;
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => document.body.removeChild(modalOverlay));
    modalContent.appendChild(closeButton);

    const interpretationTitle = document.createElement('h2');
    interpretationTitle.style.color = '#8c7ae6'; // Adjusted to match other purple tones
    interpretationTitle.textContent = 'Basic Chart Interpretations';
    modalContent.appendChild(interpretationTitle);

    const sections = {
      "Planets in Signs": interpretationsData.planetsInSigns,
      "Planets in Houses": interpretationsData.planetsInHouses,
      "Major Aspects": interpretationsData.majorAspects
    };

    // Planets in Signs
    let sectionTitle = document.createElement('h3');
    sectionTitle.textContent = 'Planets in Signs';
    modalContent.appendChild(sectionTitle);
    this.lastEphemerisResults.forEach(planet => {
      const validKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
      if (!validKeys.includes(planet.key)) return;
      const planetName = planet.key.charAt(0).toUpperCase() + planet.key.slice(1);
      const zodiacSign = this.getZodiacSign(planet.position.apparentLongitude).name;
      const key = `${planetName} in ${zodiacSign}`;
      const interpretation = sections["Planets in Signs"][key] || `No interpretation found for ${key}.`;
      const p = document.createElement('p');
      p.innerHTML = `<strong>${key}:</strong> ${interpretation}`;
      modalContent.appendChild(p);
    });

    // Planets in Houses
    sectionTitle = document.createElement('h3');
    sectionTitle.textContent = 'Planets in Houses';
    modalContent.appendChild(sectionTitle);
    this.lastEphemerisResults.forEach(planet => {
      const validKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
      if (!validKeys.includes(planet.key)) return;
      const planetName = planet.key.charAt(0).toUpperCase() + planet.key.slice(1);
      let planetLongitudeForHouseCalc = this.normalizeAngle(planet.position.apparentLongitude);
      // Adjust planet's longitude for house calculation if original ascendant was >= 180
      // This aligns the planet's position with the visual chart's (potentially flipped) cusp system.
      if (this.lastAscendant !== null && this.lastAscendant >= 180) {
        planetLongitudeForHouseCalc = this.normalizeAngle(planetLongitudeForHouseCalc - 180);
      }
      const houseNumber = this.getHouseForLongitude(planetLongitudeForHouseCalc, this.lastCusps);
      const key = `${planetName} in ${houseNumber}${this.getOrdinalSuffix(houseNumber)} House`;
      const interpretation = sections["Planets in Houses"][key] || `No interpretation found for ${key}.`;
      const p = document.createElement('p');
      p.innerHTML = `<strong>${key}:</strong> ${interpretation}`;
      modalContent.appendChild(p);
    });

    // Major Aspects
    sectionTitle = document.createElement('h3');
    sectionTitle.textContent = 'Major Aspects';
    modalContent.appendChild(sectionTitle);
    const currentOrbs = {
      'Conjunction': parseInt(this.orbConjunctionInput.value),
      'Opposition': parseInt(this.orbOppositionInput.value),
      'Trine': parseInt(this.orbTrineInput.value),
      'Square': parseInt(this.orbSquareInput.value),
      'Sextile': parseInt(this.orbSextileInput.value)
    };
    const aspects = this.calculateAspects(this.lastEphemerisResults, currentOrbs);
    if (aspects.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No major aspects found with current orb settings.';
      modalContent.appendChild(p);
    } else {
      aspects.forEach(aspect => {
        const key = `${aspect.planet1} ${aspect.aspect} ${aspect.planet2}`;
        // Also check for reversed key e.g. Moon Conjunction Sun vs Sun Conjunction Moon
        const reversedKey = `${aspect.planet2} ${aspect.aspect} ${aspect.planet1}`;
        const interpretation = sections["Major Aspects"][key] || sections["Major Aspects"][reversedKey] || `No interpretation found for ${key}.`;
        const p = document.createElement('p');
        p.innerHTML = `<strong>${key} (Orb: ${aspect.orb}°):</strong> ${interpretation}`;
        modalContent.appendChild(p);
      });
    }

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new Demo();
  } catch (e) {
    console.error('Error initializing Demo:', e);
    const errorEl = document.getElementById('error-message');
    if (errorEl) errorEl.innerHTML = 'Initialization error. Check console.';
  }
});

/*
 * Acknowledgements & Credits
 * This tool utilizes data and code from the following open-source projects and resources:
 * AstroChart.js by Kibo: github.com/Kibo/AstroChart
 * Moshier Ephemeris JS by 0xStarcat (adapted from Moshier): github.com/0xStarcat/Moshier-Ephemeris-JS
 * World Cities Database by SimpleMaps: simplemaps.com/data/world-cities
 */
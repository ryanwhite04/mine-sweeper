import { LitElement, html } from 'https://unpkg.com/@polymer/lit-element?module';
import 'https://unpkg.com/@polymer/paper-fab@next/paper-fab.js?module';
import 'https://unpkg.com/@polymer/paper-fab@next/paper-fab.js?module';
import 'https://unpkg.com/@polymer/paper-card@next/paper-card.js?module';
import 'https://unpkg.com/@polymer/paper-button@next/paper-button.js?module';
import 'https://unpkg.com/@polymer/paper-slider@next/paper-slider.js?module';
import 'https://unpkg.com/@polymer/paper-input@next/paper-input.js?module';
import 'https://unpkg.com/@polymer/paper-dropdown-menu@next/paper-dropdown-menu.js?module';
import 'https://unpkg.com/@polymer/paper-listbox@next/paper-listbox.js?module';
import 'https://unpkg.com/@polymer/paper-item@next/paper-item.js?module';
import 'https://unpkg.com/@polymer/iron-icons/iron-icons.js?module';
import 'https://unpkg.com/@polymer/iron-icons/av-icons.js?module';
import 'https://unpkg.com/@polymer/iron-collapse/iron-collapse.js?module';
import 'https://unpkg.com/@polymer/paper-button/paper-button.js?module';
import 'https://unpkg.com/@polymer/paper-toast/paper-toast.js?module';
import 'https://unpkg.com/@material/mwc-fab/mwc-fab.js?module';
import 'https://unpkg.com/@material/mwc-button/mwc-button.js?module';
import 'https://unpkg.com/@material/mwc-icon/mwc-icon.js?module';
import StopWatch from './stop-watch.js';
import './emoji-rain.js';

function setMines(rows, columns, difficulty, position) {

  let possibilities = [...new Array(rows * columns).keys()];
  possibilities.splice(possibilities.indexOf(parseInt(position)), 1);
  return shuffle(possibilities).slice(0, difficulty)

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }
}

function getNeighbours(position, rows, columns, column = position % columns, row = ~~(position / columns)) {
  return [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1], [ 0, 0], [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1],
   ].map(([i, j]) => [row + i, column + j])
   .filter(([i, j]) => i >= 0 && j >= 0 && i < rows && j < columns)
   .map(([row, column]) => row * columns + column)
}   

class Cell extends LitElement {
  static get properties() {
    return {
      mine: { type: Boolean, reflect: true },
      open: { type: Boolean, reflect: true },
      flag: { type: Boolean, reflect: true },
      count: { type: Number, reflect: true },
      disabled: { type: Boolean, reflect: true },
    }
  }

  constructor({
    mine = false,
    open = false,
    count = 0,
    position,
    disabled = false,
  } = {}) {
    super();
    this.mine = mine;
    this.open = open;
    this.count = count;
    this.position = position;
    this.disabled = disabled;
  }

  reveal() {
    this.open = true;
  }

  hide() {
    this.disabled = true;
  }

  show() {
    this.disabled = false;
  }

  render() {
    const {
      mine,
      open,
      flag,
      count,
      disabled,
    } = this;
    const label = (!mine && open && count) ? count : '';
    const icon = open ? mine ? "av:new-releases" : "" : flag ? "flag" : "";
    const color = (mine || flag) ? 'white' : [
      'white',
      'light-blue',
      'green',
      'red',
      'blue',
      'brown',
      'cyan',
      'black',
      'gray',
    ][count];
    const background = mine ? `background: var(--error-color);` : '';
    const style = `
    paper-fab { color: var(--paper-${color}-500) }
    paper-fab[disabled] {
      color: var(--paper-${color}-500;
      ${background}
    }`;
    return html`<style>${style}</style>
    <paper-fab mini
      ?disabled=${disabled || open}
      label=${disabled || label}
      icon=${disabled || icon}
    >
    </paper-fab>`;
  }
}

class MineSweeper extends LitElement {

  static get properties() {
    return {
      rows: { type: Number, reflect: true },
      columns: { type: Number, reflect: true },
      difficulty: { type: Number, reflect: true },
      flagging: { type: Boolean, reflect: true },
      outcome: { type: Number, reflect: true },
      heading: { type: String, reflect: true },
    }
  }

  constructor() {
    super();
    this.rows = 16;
    this.columns = 10;
    this.difficulty = 25;
    this.flagging = false;
    this.outcome = 0;
    this.heading = "",

    this.history = [];
    this.flags = [];
    this.mines = [];
    this.timer = new StopWatch({ paused: true, disabled: true, interval: 100 });
    this.timer.addEventListener('stop', this.hide.bind(this))
    this.timer.addEventListener('start', this.show.bind(this))
  }

  hide(e) {
    this.history.length && (this.outcome || this.cells.forEach(cell => cell.hide()))
  }

  show(e) {
    this.history.length && this.outcome || this.cells.forEach(cell => cell.show())
  }

//   set rows(rows) {
//     if (rows > 32 || rows < 1) {
// //       this.rows = (rows > 32) ? 32 : (rows < 1) ? 1 : rows;    
//       console.warn(`Rows must be between 0 and 32`)    
//     }
//     this._rows = rows; 
//   }

//   get rows() { return this._rows }

//   set columns(columns) {
//     if (columns > 32 || columns < 1) {
// //       this.columns = (columns > 32) ? 32 : (columns < 1) ? 1 : columns;  
//       console.warn(`Columns must be between 0 and 32`)    
//     }
//     this._columns = columns;  
//   }

//   get columns() { return this._columns }

//   set difficulty(difficulty) {
//     if (difficulty > (this.rows*this.columns) || difficulty < 0) {
//       console.warn(`Difficulty must be between 0 and ${this.rows * this.columns}`)  
//     }
//     this._difficulty = difficulty;     
//   }

//   get difficulty() { return this._difficulty }

  shouldUpdate(changedProperties) {
    if (changedProperties.has('rows') || changedProperties.has('columns') || changedProperties.has('difficulty')) {
      this.reset();
    }
    return true;
  }

  reset(position) {
    console.log('reset')
    this.mines = [];
    this.history = [];
    this.flags = [];
    this.cells = [...Array(this.rows * this.columns)].map((v, position) => new Cell({
      position,
      open: false,
      mine: false,
      flag: false,
      count: 0,
    }));
    this.timer.stop();
    this.timer.reset();
    this.timer.disabled = true;
    this.outcome = 0;
    this.requestUpdate();
  }

  move(position) {
    if (!this.history.length) {
      this.mines = setMines(this.rows, this.columns, this.difficulty, position);
      this.mines.forEach(position => this.placeMine(position))
      this.timer.start();
      this.timer.disabled = false;
    }
    this.open(position)
  }

  open(position, cell = this.cells[position]) {
    console.log("open", this, { position, cell });
    if (!cell.open) {
      cell.mine ? this.end(false) : this.history.push(position);
      (this.history.length) === (this.cells.length - this.mines.length) && this.end(true);
      cell.open = true;
      if (!cell.count) {
        window.requestAnimationFrame(() => getNeighbours(position, this.rows, this.columns).forEach(position => this.open(position)))
      }
    }

  }

  end(successful) {
    console.log('end', successful)
    this.outcome = successful ? 1 : -1;
    this.cells.forEach(cell => cell.reveal());
    this.timer.stop();
    this.timer.disabled = true;
    this.dispatchEvent(new CustomEvent('end', { detail: successful }))
  }

  flag(position) {
    console.log('flag', this, position)
    this.flags.includes(position) ? this.flags.splice(this.flags.indexOf(position), 1) : this.flags.push(position)
    this.cells[position].flag = !this.cells[position].flag;
  }

  placeMine(position) {
    this.cells[position].mine = true;
    getNeighbours(position, this.rows, this.columns)
      .forEach(position => this.cells[position].count++)
  }

  change({ target: { dataset: { name }, value }}) {
    console.log('change', { name, value })
    this[name] = value;
  }

  handle(e) {
    const { type, target: { open, disabled, position, nodeName }} = e;
    console.log('handle', { type, open, disabled, position, nodeName }, this.flagging)
    if (nodeName === "MINE-SWEEPER-CELL" && !open && !disabled) {
      e.preventDefault();
      if (type === "click") {
        this.flagging ? this.flag(position) : this.move(position)         
      } else if (type === "contextmenu") {
        this.flagging ? this.move(position) : this.flag(position)  
      }
    }
  }

  render() {
    const style = `:host {
      display: block;
      font-family: Roboto;
      --mdc-theme-primary: var(--accent-color);
      --mdc-theme-secondary: var(--accent-color);
      --mdc-theme-on-primary: var(--primary-text-color);
      --mdc-theme-on-secondary: white;
    } :host([hidden]) {
      display: none;
    } emoji-rain {
      position: absolute;
      top: 0;
      left: 0;
    } #grid {
      display: grid;
      grid-template-columns: repeat(${this.columns}, auto);
      grid-gap: 0.2rem;
      justify-content: center;
      font-weight: bold;
    } #reset {
      float: right;
    } #flags {
      float: right;
    }`;

    return html`<style>${style}</style>
      <paper-card heading=${this.heading}>
        <div class="card-actions">
          <mwc-button title="Reset" icon="refresh" @click=${this.reset.bind(this)}>Reset</mwc-button>
        </div>
        <div class="card-content">
          <div id="grid" @click=${this.handle} @contextmenu=${this.handle}>${this.cells}</div>
          <emoji-rain
            ?paused=${this.outcome !== 1}
            volume=${this.columns}
            emojis="✨,🏆"
            speed=${1}
            >
          </emoji-rain>
          <emoji-rain
            ?paused=${this.outcome !== -1}
            volume=${this.columns}
            emojis="💣,💥"
            speed=${1}
            >
          </emoji-rain>
        </div>
        <div class="card-actions">
          ${this.timer}
          <mwc-button id="flags" title="Toggle Flags"
            icon=${this.flagging ? 'outlined_flag' : 'flag'}
            @click=${e => this.flagging = !this.flagging}
          >${this.difficulty - this.flags.length}</mwc-button>
        </div>
        <paper-toast ?opened=${this.outcome}>
          ${this.outcome > 0 ? "Successful" : "Unsuccessful"}
        </paper-toast>
      </paper-card>
    `;
  }
}


customElements.define('mine-sweeper-cell', Cell)
customElements.define('mine-sweeper', MineSweeper)
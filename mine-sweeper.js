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
      mini: { type: Boolean, reflect: true },
    }
  }

  constructor(properties) {
    super();
    Object.assign(this, properties)
  }

  reveal() { this.open = true; }

  hide() { this.disabled = true; }

  show() { this.disabled = false; }

  get style() {
    const color = (this.mine || (this.flag && !this.open)) ? 'white' : [
      'green',
      'light-blue',
      'green',
      'red',
      'blue',
      'brown',
      'cyan',
      'black',
      'gray',
    ][this.count];
    return `color: var(--paper-${color}-500);`;
  }

  get label() {
    return (!this.mine && this.open && this.count) ? this.count : ''
  }

  get icon() {
    return this.open ? this.mine ? "av:new-releases" : "" : this.flag ? "flag" : "";
  }

  render() {
    const {
      icon, label, style,
      mine, open, flag, count, disabled, position, mini,
    } = this;
    return disabled ?
      html`<paper-fab ?mini=${mini} disabled></paper-fab>` :
      html`<paper-fab ?mini=${mini} style=${style} ?disabled=${open} label=${label} icon=${icon}></paper-fab>`;
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
      mini: { type: Boolean, reflect: true },
//       controls: { type: Boolean, reflect: true },
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
    this.cells = [...Array(this.rows * this.columns)].map((v, position) => new Cell({
      position,
      open: false,
      mine: false,
      flag: false,
      count: 0,
    }));
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

  shouldUpdate(changedProperties) {
    if (changedProperties.has('rows') || changedProperties.has('columns') || changedProperties.has('difficulty')) {
      this.reset();
    }
    return true;
  }

  reset(position) {
    this.mines = [];
    this.history = [];
    this.flags = [];
    this.cells = [...Array(this.rows * this.columns)].map((v, position) => new Cell({
      position,
      open: false,
      mine: false,
      flag: false,
      count: 0,
      mini: this.mini,
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

  open(position) {
    const cell = this.cells[position];
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
    this.outcome = successful ? 1 : -1;
    this.cells.forEach(cell => window.requestAnimationFrame(() => cell.reveal()));
    this.timer.stop();
    this.timer.disabled = true;
    this.dispatchEvent(new CustomEvent('end', { detail: successful }))
  }

  flag(position) {
    this.flags.includes(position) ? this.flags.splice(this.flags.indexOf(position), 1) : this.flags.push(position)
    this.cells[position].flag = !this.cells[position].flag;
    this.requestUpdate();
  }

  placeMine(position) {
    this.cells[position].mine = true;
    getNeighbours(position, this.rows, this.columns)
      .forEach(position => this.cells[position].count++)
  }

  change({ target: { dataset: { name }, value }}) {
    this[name] = value;
  }

  handle(e) {
    const { type, target: { open, disabled, position, nodeName }} = e;
    if (nodeName === "MINE-SWEEPER-CELL" && !open && !disabled) {
      e.preventDefault();
      if (type === "click") {
        this.flagging ? this.flag(position) : this.move(position)         
      } else if (type === "contextmenu") {
        this.flagging ? this.move(position) : this.flag(position)  
      }
    }
  }

  set mini(mini) {
    this.cells.forEach(cell => cell.mini = mini);
    this._mini = mini;
  }

  get mini() {
    return this._mini;
  }

  get style() {
    return `:host {
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
      grid-gap: 0.2rem;
      justify-content: center;
      font-weight: bold;
    } #reset {
      margin: auto;
    } #flags {
      float: right;
    } mine-sweeper-cell[mine], mine-sweeper-cell[flag]:not([open]) {
      color: white;
    } mine-sweeper-cell[mine][open] {
      --paper-fab-disabled-background: var(--error-color);
    } .card-actions {
      display: flex;
      align-items: center;
    }`;
  }

  render() {

//     const actions = this.controls ? html`<div class="card-actions">
//       ${this.timer}
//       <mwc-fab id="reset" mini title="Reset" icon="refresh" @click=${this.reset.bind(this)}></mwc-fab>
//       <mwc-button id="flags" title="Toggle Flags"
//         icon=${this.flagging ? 'flag' : 'outlined_flag'}
//         @click=${e => this.flagging = !this.flagging}
//       >${this.difficulty - this.flags.length}</mwc-button>
//     </div>` : '';

    return html`<style>${this.style}</style>
      <paper-card heading=${this.heading}>
        <slot></slot>
        <div class="card-content">
          <div id="grid"
            @click=${this.handle}
            @contextmenu=${this.handle}
            style=${`grid-template-columns: repeat(${this.columns}, auto);`}
            >${this.cells}
          </div>
          <emoji-rain
            ?paused=${this.outcome !== 1}
            volume=${this.columns*this.rows}
            emojis="✨,🏆"
            speed="4"
            power="3"
            >
          </emoji-rain>
          <emoji-rain
            ?paused=${this.outcome !== -1}
            volume=${this.columns*this.rows}
            emojis="💣,💥"
            speed="4"
            power="3"
            >
          </emoji-rain>
          <paper-toast ?opened=${this.outcome}>
            ${this.outcome > 0 ? "Successful" : "Unsuccessful"}
          </paper-toast>
        </div>
        <div class="card-actions">
          ${this.timer}
          <mwc-fab id="reset" ?mini=${this._mini} title="Reset" icon="refresh" @click=${this.reset.bind(this)}></mwc-fab>
          <mwc-button id="flags" title="Toggle Flags"
            icon=${this.flagging ? 'flag' : 'outlined_flag'}
            @click=${e => this.flagging = !this.flagging}
          >${this.difficulty - this.flags.length}</mwc-button>
        </div>
      </paper-card>
    `;
  }
}


customElements.define('mine-sweeper-cell', Cell)
customElements.define('mine-sweeper', MineSweeper)
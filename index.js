import { LitElement, html } from 'https://unpkg.com/@polymer/lit-element?module';
import 'https://unpkg.com/@material/mwc-icon@latest/mwc-icon.js?module';
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
import 'https://unpkg.com/@polymer/iron-collapse/iron-collapse.js?module';

const usefulIcons = [
  "autorenew", "bug-report", "flag", "help",
  "help-outline", "history", "home", "hourglass-empty",
  "hourglass-full", "query-builder", "refresh", "schedule",
  "settings", "settings-applications", "store", "watch-later"
];

class TimeKeeper extends LitElement {

  static get properties() {
    return {
      time: {
         type: Number,
         reflect: true,
      }
    }
  }

  render() {

    
//     return html`<paper-fab
//       icon="hourglass"
//       label=${this.time}>
//     </paper-fab>`;
    return html`<div>${this.time}</div>`;
  
  }

}

class MinesweeperGrid extends LitElement {

  static get properties() {
    return {
      rows: {
        type: Number,
        reflect: true,
      },
      columns: {
        type: Number,
        reflect: true,
      },
      difficulty: {
        type: Number,
        reflect: true,
      },
      history: { type: Array },
      flags:   { type: Array },
      mines:   { type: Array },
    }
  }

  constructor() {
    super();
    this.rows = 6;
    this.columns = 8;
    this.difficulty = 0.2;
    this.history = [];
    this.flags = [];
    this.mines = [];
  }

  shouldUpdate(changedProperties) {
    console.log('shouldUpdate', { changedProperties })
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
  }

  move(position) {
    return () => {
      console.log('move', this, position)
      this.history.push(position)
      if (this.history.length === 1) {
        this.mines = setMines(this.rows, this.columns, this.difficulty, position);
      }
      this.requestUpdate();
    }
  }

  flag(position) {
    return event => {
      event.preventDefault();
      console.log('flag', this, event, position)
      this.flags.push(position)
      this.requestUpdate();
    }
  }

  mine(position) {
    this.cells[position].mine = true;
    getNeighbours(position, this.rows, this.columns)
      .forEach(position => this.cells[position].count++)

  }

  open(position) {
    this.cells[position].open = true;
    this.cells[position].count || getNeighbours(position, this.rows, this.columns)
      .filter(position => !this.cells[position].open)
      .map(this.open.bind(this))
  }

  fire(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail }))
  }

  change({ target: { dataset: { name }, value }}) {
    console.log('change', { name, value })
    this[name] = value;
  }

  render() {
    let {
      rows, columns, difficulty,
      mines, history, flags,
    } = this;

    this.cells = [...Array(rows * columns)].map((v, i) => ({
      position: i,
      open: false,
      mine: false,
      flag: false,
      count: 0,
    }));

    // Add mine locations and counts
//     flags.forEach(position => this.cells[position].flag = true)
    mines.forEach(this.mine.bind(this))
    history.forEach(this.open.bind(this))

    if (history.find(position => mines.includes(position))) {
      this.cells = this.cells
//         .filter(({ mine }) => mine)
        .map(cell => ({ ...cell, open: true }))
      this.fire('lose')
    } else if ((this.cells.length - this.mines.length) === this.cells.filter(({ open }) => open).length) {
      this.cells = this.cells.map(cell => ({ ...cell, open: true }))
      this.fire('win')
    }

    console.log('render', {
      rows, columns, difficulty, mines,
      cells: this.cells,
    })

    return html`
      <style>
        :host {
          display: block;
          font-family: Roboto;
        }
        :host([hidden]) {
          display: none;
        }
        .card-content {
          display: grid;
          grid-template-columns: repeat(${this.columns}, auto);
          grid-gap: 0.2rem;
          justify-content: center;
          font-weight: bold;
        }
        .reset {
          --paper-button-background: var(--paper-red-700);
          background: var(--paper-red-500);
        }
        paper-fab[label="1"] {
          color: var(--paper-light-blue-500);
        }
        paper-fab[label="2"] {
          color: var(--paper-green-500);
        }
        paper-fab[label="3"] {
          color: var(--paper-red-500);
        }
        paper-fab[label="4"] {
          color: var(--paper-blue-500);
        }
        paper-fab[label="5"] {
          color: var(--paper-brown-500);
        }
        paper-fab[label="6"] {
          color: var(--paper-cyan-500);
        }
        paper-fab[label="7"] {
          color: var(--paper-black);
        }
        paper-fab[label="8"] {
          color: var(--paper-gray-500);
        }
        paper-fab[mine] {
          --paper-fab-disabled-background: var(--paper-red-500);
        }
        paper-fab[flag] {
          color: var(--paper-amber-500);
        }
      </style>

      <paper-card heading="Title">

        <time-keeper time="0"></time-keeper>

        <div class="card-actions">

          <paper-dropdown-menu label="Difficulty">
            <paper-listbox slot="dropdown-content" selected="1">
              <paper-item>Simple</paper-item>
              <paper-item>Medium</paper-item>
              <paper-item>Expert</paper-item>
              <paper-item>Custom</paper-item>
            </paper-listbox>
          </paper-dropdown-menu>

          <iron-collapse id="collapse" ?opened=${this.opened}>
            
            <div>Rows</div>
            <paper-slider
              data-name="rows"
              label="Rows"
              @change=${this.change}
              value=${this.rows}
              max="100"
              editable pin snaps>
            </paper-slider>

            <div>Columns</div>
            <paper-slider
              data-name="columns"
              label="Columns"
              @change=${this.change}
              value=${this.columns}
              max="100"
              editable pin>
            </paper-slider>

            <div>Difficulty</div>
            <paper-slider
              data-name="difficulty"
              label="Difficulty"
              @change=${this.change}
              value=${this.difficulty}
              max="1"
              editable pin step="0.1" snaps>
            </paper-slider>

          </iron-collapse>

          <paper-button class="reset" @click=${this.reset.bind(this)}>Reset</paper-button>
        </div>
        <div class="card-content">
          ${this.cells.map(({ mine, open, flag, count }, position) => {
            const label = (!mine && open && count) ? count : '';
            return html`<paper-fab
              mini
              ?disabled=${open && !flag}
              label=${label}
              ?flag=${flag}
              ?mine=${mine}
              icon=${flag ? "flag" : ""}
              @click=${this.move(position)}
              @contextmenu=${this.flag(position)}
            ></paper-fab>`;
          })}
        </div>
      </paper-card>
    `;
  }
}

// Mines can't be located on already open squares
function setMines(rows, columns, difficulty, position) {
  console.log('setMines', {
    rows, columns, difficulty, position
  })
  let possibilities = [...new Array(rows * columns).keys()];
  possibilities.splice(possibilities.indexOf(position), 1);
  return shuffle(possibilities)
    .slice(0, Math.round(rows * columns * difficulty))

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
   ].map(([i, j]) => [row + i, column + j]).filter(([i, j]) => i >= 0 && j >= 0 && i < rows && j < columns).map(([row, column]) => row * columns + column)
}   

customElements.define('time-keeper', TimeKeeper);
customElements.define('minesweeper-grid', MinesweeperGrid);
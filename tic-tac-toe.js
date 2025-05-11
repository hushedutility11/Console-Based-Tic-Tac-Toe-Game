#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

const GAME_STATE_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.tic_tac_toe_game.json');

// Initialize the 3x3 board
let board = [
  ['.', '.', '.'],
  ['.', '.', '.'],
  ['.', '.', '.'],
];
let currentPlayer = 'X';

async function saveGame() {
  const state = { board, currentPlayer };
  await fs.writeFile(GAME_STATE_FILE, JSON.stringify(state, null, 2));
  console.log(chalk.green('Game saved successfully!'));
}

async function loadGame() {
  try {
    const data = await fs.readFile(GAME_STATE_FILE, 'utf8');
    const state = JSON.parse(data);
    board = state.board;
    currentPlayer = state.currentPlayer;
    console.log(chalk.green('Game loaded successfully!'));
  } catch {
    console.log(chalk.yellow('No saved game found. Starting a new game.'));
  }
}

function displayBoard() {
  console.log(chalk.blue('  1 2 3'));
  for (let i = 0; i < 3; i++) {
    let row = `${i + 1} `;
    for (let j = 0; j < 3; j++) {
      const cell = board[i][j];
      const color = cell === 'X' ? chalk.red : cell === 'O' ? chalk.blue : chalk.gray;
      row += color(cell === '.' ? '.' : cell) + ' ';
    }
    console.log(row);
  }
  console.log(chalk.cyan(`Current player: ${currentPlayer}`));
}

// Check for a winner or draw
function checkWin() {
  // Check rows
  for (let i = 0; i < 3; i++) {
    if (board[i][0] !== '.' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return board[i][0];
    }
  }
  // Check columns
  for (let j = 0; j < 3; j++) {
    if (board[0][j] !== '.' && board[0][j] === board[1][j] && board[1][j] === board[2][j]) {
      return board[0][j];
    }
  }
  // Check diagonals
  if (board[0][0] !== '.' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0];
  }
  if (board[0][2] !== '.' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2];
  }
  // Check for draw
  if (board.every(row => row.every(cell => cell !== '.'))) {
    return 'draw';
  }
  return null;
}

// Parse user input coordinates (e.g., "1,2") into array indices
function parseMove(move) {
  if (!/^[1-3],[1-3]$/.test(move)) {
    throw new Error('Invalid move format. Use coordinates (e.g., 1,2).');
  }
  const [row, col] = move.split(',').map(num => parseInt(num) - 1);
  return [row, col];
}

async function makeMove(move) {
  try {
    const [row, col] = parseMove(move);
    if (board[row][col] !== '.') {
      console.log(chalk.red('This cell is already taken! Choose another.'));
      return;
    }
    board[row][col] = currentPlayer;
    const result = checkWin();
    if (result) {
      displayBoard();
      if (result === 'draw') {
        console.log(chalk.yellow('Game is a draw!'));
      } else {
        console.log(chalk.green(`Player ${result} wins!`));
      }
      board = [['.', '.', '.'], ['.', '.', '.'], ['.', '.', '.']]; // Reset board
      currentPlayer = 'X';
      return;
    }
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    console.log(chalk.green('Move successful!'));
    displayBoard();
  } catch (error) {
    console.log(chalk.red(error.message));
  }
}

program
  .command('move <coordinates>')
  .description('Make a move using coordinates (e.g., 1,2)')
  .action((coordinates) => makeMove(coordinates));

program
  .command('board')
  .description('Display the current board')
  .action(() => displayBoard());

program
  .command('save')
  .description('Save the current game state')
  .action(() => saveGame());

program
  .command('load')
  .description('Load a saved game')
  .action(async () => {
    await loadGame();
    displayBoard();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  displayBoard();
}

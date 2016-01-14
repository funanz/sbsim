/*
The MIT License (MIT)

Copyright (c) 2016 granz.fisherman@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
var Settings = {};
Settings.numPlayer = 5;
Settings.bet = 100;
Settings.maxBet = 1000;
Settings.betMap = { 5: 100, 10: 1000, 20: 10000 };
Settings.times = 1000;
Settings.waitSuperBingo = false;
Settings.useChance = true;
Settings.running = false;

window.onload = function () {
    onNumPlayerChanged();
}

function onNumPlayerChanged() {
    var numPlayer = getSelectListValue("numPlayer");
    var bet = Settings.betMap[numPlayer];
    updateBetList(bet);
}

function onStart(waitSuperBingo) {
    if (Settings.running) return;
    Settings.running = true;

    Settings.times = getInputValue("times");
    Settings.numPlayer = getSelectListValue("numPlayer");
    Settings.bet = getSelectListValue("bet");
    Settings.maxBet = Settings.betMap[Settings.numPlayer] * 10;
    Settings.waitSuperBingo = waitSuperBingo;
    Settings.useChance = getInputChecked("chance");

    run(Settings);
}

function updateBetList(bet) {
    var selectBet = document.getElementById("bet");
    selectBet.options.length = 10;

    for (var i = 0; i < 10; i++) {
        var n = bet * (i + 1);
        selectBet.options[i].value = n;
        selectBet.options[i].text = n.toLocaleString();
    }
}

function run(settings) {
    var times = settings.times;
    var result = new Result();

    var mainLoop = function (interval) {
        var room = new Room();
        room.numPlayer = settings.numPlayer;
        room.maxBet = settings.maxBet;
        room.bet = settings.bet;
        room.useChance = settings.useChance;
        room.play();

        var player = room.players[0];
        if (player.card.isSuperBingo)
            result.sbingo++;
        if (player.card.isBingo)
            result.bingo++;

        switch (player.rank) {
            case 1: result.rank1++; break;
            case 2: result.rank2++; break;
            case 3: result.rank3++; break;
            case 4: result.rank4++; break;
        }

        result.times++;
        result.bet += player.bet;
        result.prise += room.payment(player);
        result.total += room.payment(player) - player.bet;
        result.totalMin = Math.min(result.total, result.totalMin);
        result.totalMax = Math.max(result.total, result.totalMax);

        var continueLoop = false;
        if (settings.waitSuperBingo)
            continueLoop = result.sbingo <= 0;
        else
            continueLoop = result.times < times;

        if (!continueLoop) {
            displayResultMessage(settings, result);
            settings.running = false;
        }

        return continueLoop;
    }
    var interval = function () {
        displayResult(result);
    }

    timerLoop(mainLoop, interval);
}

function timerLoop(mainLoop, interval) {
    (function () {
        for (var i = 0; i < 127; i++) {
            if (!mainLoop()) {
                interval();
                return;
            }
        }
        interval();
        setTimeout(arguments.callee, 0);
    })();
}

function Result() {
    this.times = 0;
    this.bingo = 0;
    this.sbingo = 0;
    this.rank1 = 0;
    this.rank2 = 0;
    this.rank3 = 0;
    this.rank4 = 0;
    this.bet = 0;
    this.prise = 0;
    this.total = 0;
    this.totalMin = Number.MAX_VALUE;
    this.totalMax = Number.MIN_VALUE;
}

function displayResult(result) {
    displayValue("resultTimes", result.times);
    displayValue("bingo", result.bingo);
    displayValue("sbingo", result.sbingo);
    displayValue("rank1", result.rank1);
    displayValue("rank2", result.rank2);
    displayValue("rank3", result.rank3);
    displayValue("rank4", result.rank4);
    displayValue("totalBet", result.bet);
    displayValue("prise", result.prise);
    displayValue("total", result.total);
    displayValue("totalMin", result.totalMin);
    displayValue("totalMax", result.totalMax);
}

function displayResultMessage(settings, result) {
    var msg = result.times.toLocaleString() + "回中、"
        + result.sbingo.toLocaleString() + "回のスーパービンゴ！\n";
    msg += "ビンゴ：" + result.bingo.toLocaleString() + "\n";
    msg += "人数：" + settings.numPlayer.toLocaleString() + "\n";
    msg += "BET：" + result.bet.toLocaleString() + "\n";
    msg += "獲得：" + result.prise.toLocaleString() + "\n";
    msg += "合計：" + result.total.toLocaleString() + "\n";
    msg += window.location.href;

    var url = "https://twitter.com/?status=" + encodeURIComponent(msg);
    displayLink("link", "Twitterに投稿", url);

    displayString("message", msg);
}

function displayLink(id, text, url) {
    var elem = document.getElementById(id);
    elem.innerHTML = text;
    elem.href = url;
}

function displayString(id, s) {
    var elem = document.getElementById(id);
    elem.innerHTML = s.replace(/\r?\n/g, "<br/>");
}

function displayValue(id, value) {
    var elem = document.getElementById(id);
    elem.innerHTML = value.toLocaleString();
}

function getSelectListValue(id) {
    var select = document.getElementById(id);
    var i = select.selectedIndex;
    return parseInt(select.options[i].value);
}

function getInputValue(id) {
    var input = document.getElementById(id);
    return parseInt(input.value);
}

function getInputChecked(id) {
    var input = document.getElementById(id);
    return input.checked;
}

var Random = {};

Random.next = function (min, max) {
    if (arguments.length == 1)
        return Random.next1(min);
    else if (arguments.length == 2)
        return Random.next2(min, max);
    else
        throw { name: "ArgumentException" };
}

Random.next1 = function (max) {
    return Math.floor(Math.random() * max);
}

Random.next2 = function (min, max) {
    return Random.next(max - min) + min;
}

Random.shuffle = function (list, swap) {
    var size = list.length;
    for (var i = 0; i < size; i++) {
        var r = Random.next(i, size);
        if (swap) {
            swap(list[i], list[r]);
        } else {
            var temp = list[i];
            list[i] = list[r];
            list[r] = temp;
        }
    }
}

function Cell(number, color, open, diamond) {
    this.number = number;
    this.color = color;
    this.isOpen = open;
    this.isDiamond = diamond;
}

function BingoResult() {
    this.isOpen = false;
    this.bingo = 0;
    this.superBingo = 0;
}

var BingoPattern = {};

BingoPattern.patterns = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
]

BingoPattern.makeTable = function (patterns) {
    var table = [];
    for (var i = 0; i < 25; i++) {
        var list = [];
        for (var j = 0; j < patterns.length; j++) {
            var pattern = patterns[j];
            if (pattern.indexOf(i) >= 0)
                list.push(pattern);
        }
        table.push(list);
    }
    return table;
}

BingoPattern.table = BingoPattern.makeTable(BingoPattern.patterns);

BingoPattern.match = function (cells, index) {
    var result = new BingoResult();
    if (index < 0) return result;
    if (index >= this.table.length) return result;

    var patterns = this.table[index];
    for (var i = 0; i < patterns.length; i++) {
        var pattern = patterns[i];

        var bingo = true;
        var sbingo = true;

        for (var j = 0; j < pattern.length; j++) {
            var index = pattern[j];
            bingo = bingo && cells[index].isOpen;
            sbingo = sbingo && cells[index].isDiamond;
        }

        if (sbingo)
            result.superBingo++;
        else if (bingo)
            result.bingo++;
    }

    return result;
}

function Ball(number, color) {
    this.number = number;
    this.color = color;
}

function BallServer() {
    this.balls = [];
    for (var i = 0; i < 25; i++) {
        var color = Random.next(5);
        this.balls.push(new Ball(i + 1, color));
    }
    Random.shuffle(this.balls);
}

BallServer.prototype.pull = function (num) {
    if (arguments.length == 0) {
        return this.balls.pop();
    } else if (arguments.length == 1) {
        var result = [];
        for (var i = 0; i < num; i++)
            result.push(this.balls.pop());
        return result;
    } else {
        throw { name: "ArgumentException" };
    }
}

function Card() {
    var row = 5;
    var column = 5;

    this.cells = [];
    this.isBingo = false;
    this.isSuperBingo = false;

    var size = row * column;
    for (var i = 0; i < size; i++) {
        var color = i % column;
        this.cells.push(new Cell(i + 1, color));
    }

    Random.shuffle(this.cells, function (a, b) {
        var temp = a.number;
        a.number = b.number;
        b.number = temp;
    });

    this.cells[12].number = 0;
    this.cells[12].isOpen = true;
    this.cells[12].isDiamond = true;
}

Card.prototype.open = function (ball) {
    for (var i = 0; i < this.cells.length; i++) {
        var cell = this.cells[i];
        if (!cell.isOpen && cell.number == ball.number) {
            cell.isOpen = true;
            cell.isDiamond = cell.color == ball.color;
            return this.patternMatch(this.cells, i);
        }
    }
    return new BingoResult();
}

Card.prototype.openChance = function () {
    var available = [];
    for (var i = 0; i < this.cells.length; i++)
        if (!this.cells[i].isOpen)
            available.push(i);

    if (available.length > 0) {
        var r = Random.next(available.length);
        var i = available[r];
        this.cells[i].isOpen = true;
        this.cells[i].isDiamond = true;
        return this.patternMatch(this.cells, i);
    }

    return new BingoResult();
}

Card.prototype.patternMatch = function (cells, index) {
    var result = BingoPattern.match(cells, index);
    if (result.bingo > 0)
        this.isBingo = true;
    if (result.superBingo > 0)
        this.isSuperBingo = true;

    result.isOpen = true;
    return result;
}

function Player(bet) {
    this.card = new Card();
    this.bet = bet;
    this.rank = -1;
    this.chance = 0;
}

function Room() {
    this.players = [];
    this.numPlayer = 5;
    this.bet = 100;
    this.maxBet = 1000;
    this.useChance = true;
}

Room.prototype.play = function () {
    this.players = [];
    for (var i = 0; i < this.numPlayer; i++)
        this.players.push(new Player(this.bet));

    var balls = new BallServer();
    this.freeBallRound(balls);

    var rank = 1;
    for (var i = 0; i < 5; i++) {
        var ball = balls.pull();
        var bingo = this.playRound(ball, rank);
        if (bingo) rank++;
    }
}

Room.prototype.freeBallRound = function (balls) {
    var freeBalls = balls.pull(6);

    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];

        Random.shuffle(freeBalls);

        var num = Random.next(4, 7);
        for (var j = 0; j < num; j++)
            player.card.open(freeBalls[j]);

        if (player.card.isBingo)
            player.rank = 1;
    }
}

Room.prototype.playRound = function (ball, rank) {
    var bingo = false;

    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];

        var result = player.card.open(ball);
        if (result.isOpen) {
            if (result.bingo > 0 && player.rank < 0) {
                player.rank = rank;
                bingo = true;
            }

            if (this.useChance)
                player.chance++;
            if (player.chance == 3) {
                var result = player.card.openChance();
                if (result.bingo > 0 && player.rank < 0) {
                    player.rank = rank;
                    bingo = true;
                }
            }
        }
    }

    return bingo;
}

Room.prototype.payment = function (player) {
    var pay = 0;

    if (player.card.isSuperBingo) {
        var scale = (player.bet < this.maxBet) ? 700 : 777.77777777777777;
        pay += Math.floor(player.bet * scale);
    }

    if (player.rank == 1)
        pay += player.bet * 10;
    else if (player.rank == 2)
        pay += player.bet * 5;
    else if (player.rank == 3)
        pay += player.bet * 3;
    else if (player.rank == 4)
        pay += player.bet * 2;

    return pay;
}

/*
  local variables:
  mode: javascript
  indent-tabs-mode: nil
  end:
*/

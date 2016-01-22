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
Settings.betMap = { 5: 100, 10: 1000, 20: 10000 };
Settings.running = false;
Settings.debugVerifyCellCount = false;

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

    var sim = new BingoSimulator();
    sim.times = getInputValue("times");
    sim.numPlayer = getSelectListValue("numPlayer");
    sim.bet = getSelectListValue("bet");
    sim.maxBet = Settings.betMap[sim.numPlayer] * 10;
    sim.waitSuperBingo = waitSuperBingo;
    sim.chanceMode = getSelectListValue("chanceMode");
    sim.chanceModeOthers = getSelectListValue("chanceModeOthers");
    sim.reportAction = function (sim) {
        displayResult(sim);
    }
    sim.finishAction = function (sim) {
        displayResultMessage(sim);
        Settings.running = false;
    }

    sim.run();
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

function displayResult(sim) {
    var result = sim.result;

    var norank = result.bingo -
        result.rank1 - result.rank2 - result.rank3 - result.rank4;

    displayValue("resultTimes", result.times);
    displayValue("bingo", result.bingo);
    displayValue("superBingo", result.superBingo);
    displayValue("rank1", result.rank1);
    displayValue("rank2", result.rank2);
    displayValue("rank3", result.rank3);
    displayValue("rank4", result.rank4);
    displayValue("norank", norank);
    displayValue("totalBet", result.bet);
    displayValue("prize", result.prize);
    displayValue("total", result.total);
    displayValue("totalMin", result.totalMin);
    displayValue("totalMax", result.totalMax);

    displayValuePer("bingoPer", result.bingo, result.times);
    displayValuePer("superBingoPer", result.superBingo, result.times);
    displayValuePer("rank1Per", result.rank1, result.bingo);
    displayValuePer("rank2Per", result.rank2, result.bingo);
    displayValuePer("rank3Per", result.rank3, result.bingo);
    displayValuePer("rank4Per", result.rank4, result.bingo);
    displayValuePer("norankPer", norank, result.bingo);
}

function displayResultMessage(sim) {
    var result = sim.result;

    var msg = result.times.toLocaleString() + "回中、"
    msg += result.superBingo.toLocaleString() + "回のスーパービンゴ！\n";
    msg += "ビンゴ：" + result.bingo.toLocaleString() + "\n";
    msg += "人数：" + sim.numPlayer.toLocaleString() + "\n";
    msg += "BET：" + result.bet.toLocaleString() + "\n";
    msg += "獲得：" + result.prize.toLocaleString() + "\n";
    msg += "合計：" + result.total.toLocaleString() + "\n";
    msg += window.location.href;

    var url = "https://twitter.com/?status=" + encodeURIComponent(msg);
    displayLink("link", "Twitterに投稿", url);

    displayString("message", msg);
}

function displayLink(id, text, url) {
    var elem = document.getElementById(id);
    elem.innerHTML = toSafeText(text);
    elem.href = url;
}

function displayString(id, s) {
    var elem = document.getElementById(id);
    elem.innerHTML = toSafeText(s);
}

function displayValue(id, value) {
    var elem = document.getElementById(id);
    elem.innerHTML = value.toLocaleString();
}

function displayValuePer(id, num, numAll) {
    if (numAll == 0) {
        displayString(id, "-");
    } else {
        var per = num * 100 / numAll;
        displayString(id, per.toFixed(4) + "%");
    }
}

function getSelectListValue(id) {
    var select = document.getElementById(id);
    var i = select.selectedIndex;
    var n = parseInt(select.options[i].value);
    return isNaN(n) ? 0 : n;
}

function getInputValue(id) {
    var input = document.getElementById(id);
    var n = parseInt(input.value);
    return isNaN(n) ? 0 : n;
}

function toSafeText(s) {
    var escapeEntity = s.replace(/[&<>"]/g, function (m) {
        return escapeEntityMap[m];
    });
    var convertCrLf = escapeEntity.replace(/\r?\n/g, "<br/>");

    return convertCrLf;
}

var escapeEntityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
}

var ChanceMode = {};
ChanceMode.NONE = 0;
ChanceMode.FAST = 1;
ChanceMode.LAST = 2;
ChanceMode.REACH = 3;
ChanceMode.SUPER_REACH = 4;

function BingoSimulationResult() {
    this.times = 0;
    this.bingo = 0;
    this.superBingo = 0;
    this.rank1 = 0;
    this.rank2 = 0;
    this.rank3 = 0;
    this.rank4 = 0;
    this.bet = 0;
    this.prize = 0;
    this.total = 0;
    this.totalMin = Number.MAX_VALUE;
    this.totalMax = Number.MIN_VALUE;
}

function BingoSimulator() {
    this.times = 1000;
    this.numPlayer = 5;
    this.bet = 100;
    this.maxBet = 1000;
    this.waitSuperBingo = false;
    this.chanceMode = ChanceMode.REACH;
    this.chanceModeOthers = ChanceMode.REACH;
    this.reportAction = function (sim) { }
    this.finishAction = function (sim) { }
    this.loopSlice = 127;
    this.result = new BingoSimulationResult();
}

BingoSimulator.prototype.run = function () {
    timerLoop(this.mainLoop, this, this.loopSlice);
}

BingoSimulator.prototype.mainLoop = function () {
    var room = new Room();
    room.numPlayer = this.numPlayer;
    room.maxBet = this.maxBet;
    room.bet = this.bet;
    room.chanceMode = this.chanceMode;
    room.chanceModeOthers = this.chanceModeOthers;
    room.play();

    this.updateResultCount(room);

    if (this.isFinished()) {
        this.reportAction(this);
        this.finishAction(this);
        return false;
    }

    if (this.result.times % this.loopSlice == 0)
        this.reportAction(this);

    return true;
}

BingoSimulator.prototype.updateResultCount = function (room) {
    var result = this.result;

    var player = room.getPlayer();
    if (player.card.superBingo > 0)
        result.superBingo++;
    if (player.card.bingo > 0)
        result.bingo++;

    switch (player.rank) {
        case 1: result.rank1++; break;
        case 2: result.rank2++; break;
        case 3: result.rank3++; break;
        case 4: result.rank4++; break;
    }

    result.times++;
    result.bet += player.bet;
    result.prize += room.payment(player);
    result.total += room.payment(player) - player.bet;
    result.totalMin = Math.min(result.total, result.totalMin);
    result.totalMax = Math.max(result.total, result.totalMax);
}

BingoSimulator.prototype.isFinished = function () {
    if (this.waitSuperBingo)
        return this.result.superBingo > 0;
    else
        return this.result.times >= this.times;
}

function timerLoop(mainLoop, thisObject, slice, interval) {
    if (!slice) slice = 127;
    if (!interval) interval = 0;

    var beginLoop = function (thisObject) {
        for (var i = 0; i < slice; i++) {
            if (!mainLoop.call(thisObject))
                return;
        }
        setTimeout(arguments.callee, interval, thisObject);
    }
    beginLoop(thisObject);
}

var Random = {};

Random.mt = (function () {
    var mt = new MT19937ar();

    var keys = [];
    for (var i = 0; i < 128; i++)
        keys.push((Math.random() * 4294967296.0) >>> 0);
    mt.init_by_array(keys);

    return mt;
})();

Random.next = function (min, max) {
    if (arguments.length == 1)
        return Random.next1(min);
    else if (arguments.length == 2)
        return Random.next2(min, max);
    else
        throw { name: "ArgumentException" };
}

Random.next1 = function (max) {
    return Random.mt.genrand_int32() % max;
}

Random.next2 = function (min, max) {
    return Random.next1(max - min) + min;
}

Random.shuffle = function (list, swap) {
    if (arguments.length == 1)
        return Random.shuffle1(list);
    else if (arguments.length == 2)
        return Random.shuffle2(list, swap);
    else
        throw { name: "ArgumentException" };
}

Random.shuffle1 = function (list) {
    var size = list.length;
    for (var i = 0; i < size; i++) {
        var r = Random.next(i, size);
        var temp = list[i];
        list[i] = list[r];
        list[r] = temp;
    }
}

Random.shuffle2 = function (list, swap) {
    var size = list.length;
    for (var i = 0; i < size; i++) {
        var r = Random.next(i, size);
        swap(list[i], list[r]);
    }
}

function Cell(number, color, isOpen, isDiamond) {
    this.number = number;
    this.color = color;
    this.isOpen = isOpen;
    this.isDiamond = isDiamond;
}

function BingoResult() {
    this.bingo = 0;
    this.reach = 0;
    this.superBingo = 0;
    this.superReach = 0;
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

BingoPattern.makeDependTable = function (patterns) {
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

BingoPattern.dependTable = BingoPattern.makeDependTable(BingoPattern.patterns);

BingoPattern.count = function (cells, patterns, countAction, countActionArgs) {
    var count = {};
    count.result = new BingoResult();
    count.open = 0;
    count.diamond = 0;
    count.args = countActionArgs;

    for (var i = 0; i < patterns.length; i++) {
        var pattern = patterns[i];

        count.open = 0;
        count.diamond = 0;
        for (var j = 0; j < pattern.length; j++) {
            var index = pattern[j];
            if (cells[index].isOpen) {
                count.open++;
                if (cells[index].isDiamond)
                    count.diamond++;
            }
        }

        countAction(count);
    }

    return count.result;
}

BingoPattern.countAll = function (cells) {
    return this.count(cells, this.patterns, this.countActionAll)
}

BingoPattern.countActionAll = function (count) {
    if (count.open == 5) {
        if (count.diamond == 5)
            count.result.superBingo++;
        else
            count.result.bingo++;
    } else if (count.open == 4) {
        if (count.diamond == 4)
            count.result.superReach++;
        else
            count.result.reach++;
    }
}

BingoPattern.countDiffsFromOpenCell = function (cells, cellIndex) {
    if (cellIndex < 0) throw { name: "ArgumentException" };
    if (cellIndex >= cells.length) throw { name: "ArgumentException" };
    if (cellIndex >= this.dependTable.length) throw { name: "ArgumentException" };

    var openCell = cells[cellIndex];
    var patterns = this.dependTable[cellIndex];
    return this.count(cells, patterns, this.countActionDiffsFromOpenCell, openCell);
}

BingoPattern.countActionDiffsFromOpenCell = function (count) {
    var openCell = count.args;

    if (count.open == 5) {
        if (count.diamond == 5) {
            count.result.superBingo++;
            count.result.superReach--;
        } else {
            count.result.bingo++;
            if (count.diamond == 4 && !openCell.isDiamond)
                count.result.superReach--;
            else
                count.result.reach--;
        }
    } else if (count.open == 4) {
        if (count.diamond == 4)
            count.result.superReach++;
        else
            count.result.reach++;
    }
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
    if (arguments.length == 0)
        return this.pull0();
    else if (arguments.length == 1)
        return this.pull1(num);
    else
        throw { name: "ArgumentException" };
}

BallServer.prototype.pull0 = function () {
    if (this.balls.length <= 0) return null;

    return this.balls.pop();
}

BallServer.prototype.pull1 = function (num) {
    var result = [];
    for (var i = 0; i < num; i++) {
        var ball = this.pull0();
        if (!ball)
            break;
        result.push(ball);
    }
    return result;
}

function Card() {
    this.row = 5;
    this.column = 5;
    this.cells = [];
    this.bingo = 0;
    this.reach = 0;
    this.superBingo = 0;
    this.superReach = 0;

    var size = this.row * this.column;
    for (var i = 0; i < size; i++) {
        var color = i % this.column;
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

            return this.updateCellCount(i);
        }
    }

    return null;
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

        return this.updateCellCount(i);
    }

    return null;
}

Card.prototype.updateCellCount = function (cellIndex) {
    var result = BingoPattern.countDiffsFromOpenCell(this.cells, cellIndex);

    this.bingo += result.bingo;
    this.reach += result.reach;
    this.superBingo += result.superBingo;
    this.superReach += result.superReach;

    if (Settings.debugVerifyCellCount)
        this.verifyCellCount();

    return result;
}

Card.prototype.verifyCellCount = function () {
    var all = BingoPattern.countAll(this.cells);

    var ok = true;
    if (this.bingo != all.bingo) ok = false;
    if (this.reach != all.reach) ok = false;
    if (this.superBingo != all.superBingo) ok = false;
    if (this.superReach != all.superReach) ok = false;

    if (ok) return;

    console.log(this.toString());
    console.log("diff: bingo=%d reach=%d sbingo=%d sreach=%d",
        this.bingo, this.reach, this.superBingo, this.superReach);
    console.log("all:  bingo=%d reach=%d sbingo=%d sreach=%d",
        all.bingo, all.reach, all.superBingo, all.superReach);
    console.log("---");

    throw { name: "TestException" };
}

Card.prototype.toString = function () {
    var result = "";
    for (i = 0; i < this.row; i++) {
        var s = "|";
        for (j = 0; j < this.column; j++) {
            var cell = this.cells[i * this.row + j];
            s += cell.isOpen ? "o" : " ";
            s += cell.isDiamond ? "*" : " ";
            s += "|";
        }
        result += s + "\n";
    }
    return result;
}

function Player() {
    this.card = new Card();
    this.bet = 100;
    this.rank = -1;
    this.chance = 0;
}

Player.prototype.setChanceMode = function (chanceMode) {
    var action = this.chanceModeMap[chanceMode];
    if (!action)
        throw { name: "NotImplementedException" };
    this.canIncrementChance = action;
}

Player.prototype.incrementChance = function (round) {
    if (this.canIncrementChance(round))
        this.chance++;
    return this.chance;
}

Player.prototype.canIncrementChanceNone = function (round) {
    return false;
}

Player.prototype.canIncrementChanceFast = function (round) {
    return true;
}

Player.prototype.canIncrementChanceLast = function (round) {
    if (this.chance < 2) return true;
    if (round == 5) return true;
    return false;
}

Player.prototype.canIncrementChanceReach = function (round) {
    if (this.chance < 2) return true;
    if (round == 5) return true;
    return this.card.reach > 0 || this.card.superReach > 0;
}

Player.prototype.canIncrementChanceSuperReach = function (round) {
    if (this.chance < 2) return true;
    if (round == 5) return true;
    return this.card.superReach > 0;
}

Player.prototype.canIncrementChance =
    Player.prototype.canIncrementChanceNone;

Player.prototype.chanceModeMap = {};
Player.prototype.chanceModeMap[ChanceMode.NONE] =
    Player.prototype.canIncrementChanceNone;
Player.prototype.chanceModeMap[ChanceMode.FAST] =
    Player.prototype.canIncrementChanceFast;
Player.prototype.chanceModeMap[ChanceMode.LAST] =
    Player.prototype.canIncrementChanceLast;
Player.prototype.chanceModeMap[ChanceMode.REACH] =
    Player.prototype.canIncrementChanceReach;
Player.prototype.chanceModeMap[ChanceMode.SUPER_REACH] =
    Player.prototype.canIncrementChanceSuperReach;

function Room() {
    this.players = [];
    this.numPlayer = 5;
    this.bet = 100;
    this.maxBet = 1000;
    this.chanceMode = ChanceMode.REACH;
    this.chanceModeOthers = ChanceMode.REACH;
}

Room.prototype.play = function () {
    this.players = [];
    for (var i = 0; i < this.numPlayer; i++) {
        var player = new Player();
        player.bet = this.bet;
        player.setChanceMode(this.chanceModeOthers);
        this.players.push(player);
    }
    this.players[0].setChanceMode(this.chanceMode);

    var balls = new BallServer();
    this.freeBallRound(balls);

    var rank = 1;
    for (var i = 0; i < 5; i++) {
        var ball = balls.pull();
        var bingo = this.playRound(ball, rank, i + 1);
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

        if (player.card.bingo > 0)
            player.rank = 1;
    }
}

Room.prototype.playRound = function (ball, rank, round) {
    var bingo = false;

    for (var i = 0; i < this.players.length; i++) {
        var player = this.players[i];

        if (player.card.superBingo > 0) continue;
        if (player.card.bingo > 0) continue;

        var open = player.card.open(ball);
        if (open) {
            if (open.superBingo > 0) continue;
            if (open.bingo > 0) {
                player.rank = rank;
                bingo = true;
                continue;
            }

            if (player.incrementChance(round) == 3) {
                var open = player.card.openChance();
                if (open) {
                    if (open.superBingo > 0) continue;
                    if (open.bingo > 0) {
                        player.rank = rank;
                        bingo = true;
                        continue;
                    }
                }
            }
        }
    }

    return bingo;
}

Room.prototype.getPlayer = function () {
    return this.players[0];
}

Room.prototype.payment = function (player) {
    var pay = 0;

    if (player.card.superBingo > 0) {
        if (player.bet < this.maxBet)
            pay += player.bet * 700;
        else
            pay += Math.floor(player.bet * 777.77777777777777);
    }

    switch (player.rank) {
        case 1: pay += player.bet * 10; break;
        case 2: pay += player.bet * 5; break;
        case 3: pay += player.bet * 3; break;
        case 4: pay += player.bet * 2; break;
    }

    return pay;
}

/*
  local variables:
  mode: javascript
  indent-tabs-mode: nil
  end:
*/

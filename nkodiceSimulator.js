class NkodiceSimulator {

    constructor(peeRatePerMille, isArcade = false, diceWeights = undefined) {
        // setup configuration.
        this.peeRatePerMille = peeRatePerMille;
        this.diceWeights = diceWeights ? diceWeights : [1000, 1000, 1000, 1000, 1000, 1000];
        // init diceAmount
        this.diceAmount = 5;
        this.beforeResult = null;
        this.currentRoll = 0;
        // arcade
        this.isArcade = isArcade;
        this.remainRoll = 3;
        this.gameCount = 1;
    }

    roll() {
        // arcade
        if(this.isArcade) {
            this.remainRoll -= 1;
        }
        this.currentRoll += 1;
        // roll dice and judge!
        const rollResult = this.rollDices(this.diceAmount);
        const result = this.judge(rollResult);
        this.beforeResult = result;
        this.diceAmount = this.nextDice(result);
        //console.log(result);
        //console.log(`next dice: ${this.diceAmount}`);
        if (this.isArcade) {
            this.remainRoll = this.remainRoll + (result.words.length > 0)
            result['isGameOver'] = this.remainRoll === 0;
            if (this.remainRoll === 0) {
                // game over!
                console.log('game over!');
                this.remainRoll = 3;
                this.currentRoll = 0;
                this.gameCount += 1;
            }
        }
        return result;
    }

    nextDice(result) {
        if (result.words.filter(x => x === "おちんちん").length > 0) {
            return 10;
        }
        return 5 + (result.words.length > 1 ? result.words.length - 1 : 0);
    }

    judge(rollResult) {
        const counts = {};
        for (const letter of ["う", "お", "こ", "ち", "ま", "ん", "・"]) {
            counts[letter] = rollResult.filter(x => x === letter).length;
        }
        const comboSnap = this.beforeResult ? this.beforeResult['combo'] : {};
        const thisTimeComboSnap = {}
        const wordsJudge = [];
        // category C
        if (counts["お"] > 0 && counts["ち"] > 1 && counts["ん"] > 1) {
            wordsJudge.push("おちんちん");
            thisTimeComboSnap["おちんちん"] = "おちんちん" in comboSnap ? comboSnap.おちんちん + 1 : 1;
        }
        if (counts["お"] === 0 && counts["ち"] > 1 && counts["ん"] > 1) {
            wordsJudge.push("ちんちん");
            thisTimeComboSnap["ちんちん"] = "ちんちん" in comboSnap ? comboSnap.ちんちん + 1 : 1;
        }
        if (counts["ち"] > 0 && counts["ん"] > 0 && counts["こ"] > 0) {
            wordsJudge.push("ちんこ");
            thisTimeComboSnap["ちんこ"] = "ちんこ" in comboSnap ? comboSnap.ちんこ + 1 : 1;
        }
        // category M
        if (counts["お"] > 0 && counts["ま"] > 0 && counts["ん"] > 0 && counts["こ"] > 0) {
            wordsJudge.push("おまんこ");
            thisTimeComboSnap["おまんこ"] = "おまんこ" in comboSnap ? comboSnap.おまんこ + 1 : 1;
        }
        if (counts["ま"] > 0 && counts["ん"] > 0 && counts["こ"] > 0 && counts["お"] === 0) {
            wordsJudge.push("まんこ");
            thisTimeComboSnap["まんこ"] = "まんこ" in comboSnap ? comboSnap.まんこ + 1 : 1;
        }
        // category U
        if (counts["う"] > 0 && counts["ん"] > 0 && counts["ち"] > 0) {
            wordsJudge.push("うんち");
            thisTimeComboSnap["うんち"] = "うんち" in comboSnap ? comboSnap.うんち + 1 : 1;
        }
        if (counts["う"] > 0 && counts["ん"] > 0 && counts["こ"] > 0) {
            wordsJudge.push("うんこ");
            thisTimeComboSnap["うんこ"] = "うんこ" in comboSnap ? comboSnap.うんこ + 1 : 1;
        }
        return {
            "rollCount": this.currentRoll,
            "roll": rollResult,
            "combo": thisTimeComboSnap,
            "words": wordsJudge,
            "score": this.calculateScore(counts, thisTimeComboSnap)
        }
    }

    calculateScore(counts, combo) {
        const score = {U: 0, M: 0, C: 0};
        // basic faces score
        score.U = counts["う"] * 500 + counts["ん"] * 50 + counts["こ"] * 100 + counts["お"] * 300 - counts["・"] * 500;
        score.M = counts["ま"] * 500 + counts["ん"] * 50 + counts["こ"] * 100 + counts["お"] * 300 - counts["・"] * 500;
        score.C = counts["ち"] * 500 + counts["ん"] * 50 + counts["こ"] * 100 + counts["お"] * 300 - counts["・"] * 500;
        // words and combo score
        if ("うんち" in combo) {
            score.U += 1000 * this.calculateComboRate(combo.うんち);
        }
        if ("うんこ" in combo) {
            score.U += 1000 * this.calculateComboRate(combo.うんこ);
        }
        if ("まんこ" in combo) {
            score.M += 1000 * this.calculateComboRate(combo.まんこ);
        }
        if ("おまんこ" in combo) {
            score.M += 5000 * this.calculateComboRate(combo.おまんこ);
        }
        if ("ちんこ" in combo) {
            score.C += 1000 * this.calculateComboRate(combo.ちんこ);
        }
        if ("ちんちん" in combo) {
            score.C += 3000 * this.calculateComboRate(combo.ちんちん);
        }
        if ("おちんちん" in combo) {
            score.C += 10000 * this.calculateComboRate(combo.おちんちん);
        }
        const rate = this.calculateZoroRate(counts);
        score.U = score.U * rate.U;
        score.M = score.M * rate.M;
        score.C = score.C * rate.C;
        return score;
    }

    calculateComboRate(comboNum) {
        switch (comboNum) {
            case 1:
                return 1;
            case 2:
                return 2;
            case 3:
                return 4;
            default:
                return 8;
        }
    }

    calculateZoroRate(counts) {
        // i can not understand this rule.
        // maybe it is wrong...
        // i can not guess 'ううううんんんん' pattern.
        // i can not guess 'んんんんおおおお' pattern.

        // umc basic rate
        const u = counts["う"] - 2;
        const uRate = u > 1 ? u + 1 : 1;
        const m = counts["ま"] - 2;
        const mRate = m > 1 ? m + 1 : 1;
        const c = counts["ち"] - 2;
        const cRate = c > 1 ? c + 1 : 1;
        // n
        const n = counts["ん"] - 2;
        const nRate = n > 1 ? -n - 2 : 0;
        // k
        const k = counts["こ"] - 2;
        const kRate = k > 1 ? k + 0.5 : 0;
        // o
        const o = counts["お"] - 2;
        const oRate = o > 1 ? o + 0.5 : 0;
        const absFlag = o > 1;

        let rate = {
            U: uRate + nRate + kRate + oRate,
            M: mRate + nRate + kRate + oRate,
            C: cRate + nRate + kRate + oRate
        }
        if (absFlag) {
            rate.U = Math.abs(rate.U);
            rate.M = Math.abs(rate.M);
            rate.C = Math.abs(rate.C);
        }
        return rate
    }

    rollDices(diceNum) {
        let pee = 0;
        for (let i = 0; i < diceNum; i++) {
            // PerMille
            const rand = Math.floor(Math.random() * 1000);
            if (rand < this.peeRatePerMille) {
                pee++;
            }
        }
        // dice must be 3 or higher
        let validDice = (diceNum - pee) < 3 ? 3 : diceNum - pee;
        const rollResult = [];
        for (let i = 0; i < diceNum; i++) {
            i < validDice ? rollResult.push(this.rollDice()) : rollResult.push("・")
        }
        return rollResult;
    }

    rollDice() {
        const sum = this.diceWeights.reduce((l, r) => l + r);
        const rand = Math.floor(Math.random() * sum);
        let sep = 0;
        let idx = 0;
        for (const w of this.diceWeights) {
            sep = sep + w;
            if (rand < sep) {
                break
            }
            idx++;
        }
        return ["う", "お", "こ", "ち", "ま", "ん"][idx];
    }
}
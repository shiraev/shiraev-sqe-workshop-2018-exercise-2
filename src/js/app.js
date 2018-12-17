import $ from 'jquery';
import {parseCode} from './code-analyzer';
import * as esprima from 'esprima';
var safeEval = require('safe-eval');


let userInput;
let globals = [];
let params = [];
let originCode;
let sub;
let colors = [];

/*
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
    $('#inputSubmissionButton').click(() => {
        let input = $('#inputPlaceholder').val();
        $('#parsedCode').val(JSON.stringify(input, null, 2));
    });
});
*/
let extractParams = function (x){
    if('params' in x)
        return (x.params).map( x => x['name']);
    return [];
};

let extractArgsVal = function(x) {
    let values = [];
    for(let i = 0; i < x.length; i++){
        if(x[i]!== ' ' && x[i]!== ',' && x[i]!=='"'){
            values.push(x[i]);
        }
    }
    return values;
};
let varHandlerValueHelper = function (x) {
    if(x.init !== null){
        let range = x.init['range'];
        return originCode.substring(range[0],range[1]);
    }
    return [];
};

let varOrganizer = function (name, value){
    return {name, value};
};

let handleGlobal = function (x) {
    let program = esprima.parseScript(x, {loc:true, range: true});
    let body = program.body;
    for(let i = 0; i < body.length; i++){
        if(body[i].type === 'VariableDeclaration'){
            let x = body[i];
            let name = (x.declarations).map( x => x.id['name']);
            let value = (x.declarations).map( x => varHandlerValueHelper(x));
            let vars =[];
            for (let i= 0; i < name.length; i++)
                vars[i] = varOrganizer(name[i], value[i]);
            globals.push(vars[0]);
        }
        else {
            params = params.concat(extractParams(body[i]));
            break;
        }
    }
};

let mergeValues = function (){
    let argsVal = [];
    for (let i= 0; i < params.length; i++)
        argsVal[i] = varOrganizer(params[i], userInput[i]);
    globals = globals.concat(argsVal);
};
let getRealVal = function (x) {
    for (let i = 0; i < globals.length; i++){
        if(globals[i].name === x){
            return globals[i].value;
        }
    }
    return x;
};
let replaceTest = function(test) {
    let newTest = '';
    for (let i = 0; i < test.length; i++){
        newTest = newTest + getRealVal(test[i]);
    }
    return newTest;
};

let createColor = function (bool, line){
    let color;
    if(bool)
        color = 'g';
    else color = 'r';
    colors.push({line, color});
};

let ifLine = function (line, i){
    if(sub[i] === '\n') {
        line = line + 1;
    }
    return line;
};



let ifSearchAndEval = function () {
    let tmp, line = 1;
    for (let i = 0; i < sub.length; i++){
        if(sub[i] === 'i' && sub[i+1] === 'f'){
            let j = i + 2;
            tmp = sub[j];
            j++;
            while (sub[j]!== '{') {
                tmp = tmp + sub[j -1];
                j++;
            }
            tmp = tmp.substring(3, tmp.length-1);
            let repTest = replaceTest(tmp);
            let test = safeEval(repTest);
            createColor(test, line);
        } else {
            line = ifLine(line, i);
        }
    }
};

let start = function () {

    mergeValues();
    ifSearchAndEval();
    DisplayFunc();
};



function getBr(){
    return document.createElement('br');
}

function getSpan(){
    return document.createElement('span');
}

let addLine = function(lineText, line, paragraph, div1){
    lineText = document.createTextNode(line);
    let span= getSpan();
    span.appendChild(lineText);
    paragraph.appendChild(span);
    paragraph.appendChild(getBr());
    div1.appendChild(paragraph);
};

let ifTmp = function (lineNum, span) {
    if(colors!==null && colors.length>0) {
        if (colors[0].line === lineNum) {
            span.className = colors[0].color;
            colors.shift();
        }
    }
};

function DisplayFunc(){
    let div1 = document.getElementById('div1'), paragraph = document.createElement('p'), line='', lineText, lineNum=0;
    div1.innerHTML = '';
    for (let i = 0; i < sub.length; i++)
    {
        let c = sub.charAt(i);
        if(c ==='\n'){
            lineNum++;
            lineText = document.createTextNode(line);
            let span= getSpan();
            ifTmp(lineNum, span);
            span.appendChild(lineText);
            paragraph.appendChild(span);
            paragraph.appendChild(getBr());
            line='';
        } else if(c === '{') line = line +'\t' + c; else line = line + c;
    }
    addLine(lineText, line, paragraph, div1);
}


$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        globals = [];
        params = [];
        colors = [];
        let codeToParse = $('#codePlaceholder').val();
        originCode = codeToParse;
        handleGlobal(codeToParse);
        let parsedCode = parseCode(codeToParse);
        sub = parsedCode;
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
    $('#inputSubmissionButton').click(() => {
        let input = $('#inputPlaceholder').val();
        input = JSON.stringify(input, null, 2);
        userInput = extractArgsVal(input);
        start();
        $('#parsedCode').val(userInput);
    });
});

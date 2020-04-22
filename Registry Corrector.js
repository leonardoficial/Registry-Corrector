(function(object) {
    'use strict';

    // LIMPA CONSOLE
    console.clear();

    // REGISTROS
    var rows = object.rows;
    var acts = [];
    var regs = {
        "01": { type: "REG 01", count: 0 },
        "02": { type: "REG 02", count: 0 },
        "03": { type: "REG 03", count: 0 },
        "97": { type: "REG 97", count: 0 },
        "98": { type: "REG 98", count: 0 },
        "99": { type: "REG 99", count: 0 }
    };

    // INSERTS
    var inserts = object.inserts;
    var insert  = inserts[0];

    var prevElement = object.prevInsert(insert).text();
    var nextElement = object.nextInsert(insert).text();

    // VERIFICA SE HÁ REGISTROS EXTRAS PARA SEREM REMOVIDOS

    for(let i = 0; i < rows.length; i++) {
        let row  = rows[i];
        let type = row.childNodes[1].innerText;

        if(type in regs) {
            regs[type].count += 1;
        }

        // REG 01
        let cond1 = type == "01" && i != 0;
        // REG 03
        let cond2 = type == "03" && ($(row).next()[0]) && ($(row).next()[0]).childNodes[1].innerText == "03";
        // REG 02
        let cond3 = type == "02" && i != 1;
        // REG 98
        let cond4 = type == "98" && i != rows.length - 2;
        // REG 99
        let cond5 = type == "99" && i != rows.length - 1;
        // REG 97
        let cond6 = type == "97" && ($(row).next()[0]) && ($(row).next()[0]).childNodes[1].innerText == "97";

        // CASO HAJA REGISTROS EXTRAS, MOVER ESTES PARA FILA DE AÇÃO
        if(cond1 || cond2 || cond3 || cond4 || cond5 || cond6) {
            acts.push({
                ref: row,
                reg: type,
                type: "REMOVE"
            });
        }
    }

    // SNIPPET PARA FORMATAR STRING

    String.prototype.format = function () {
        var args = [].slice.call(arguments);
        return this.replace(/(\{\d+\})/g, function (a){
            return args[+(a.substr(1,a.length-2))||0];
        });
    };

    // TEMPLATE DA TABELA INFOMARTIVA

    var template = ""
        + "+--+--+--+--+--+--+--+--+--+ \n"
        + "| {0} | {2} | STATUS | \n"
        + "+--+--+--+--+--+--+--+--+--+ \n"
        + "|    {1}   |    {3}   |  {4}  | \n"
        + "+--+--+--+--+--+--+--+--+--+";

    // PRINT STATUS DOS ARQUIVO L0

    var vector = [
        ["01", "99"],
        ["02", "98"],
        ["03", "97"]
    ];

    var results = [];

    for(let i in vector) {
        let reg_start = regs[vector[i][0]];
        let reg_stop  = regs[vector[i][1]];

        let reg_status   = "OKAY";
        let reg_status_f = false;

        let cond1 = reg_start.count == 0;
        let cond2 = reg_stop.count  == 0;
        let cond3 = reg_start.count != reg_stop.count;

        if(cond1 || cond2 || cond3) {
            reg_status   = "ERRO";
            reg_status_f = "%cERRO%c";
        }

        let str = template.format(
            reg_start.type, reg_start.count,
            reg_stop.type,  reg_stop.count,
            (reg_status_f || reg_status)
        );

        results.push({
            status: reg_status,
            template: str
        });

    }

    // PRINT RESULTADO DA ANALISE DO STATUS DO ARQUIVO

    for(let i = 0; i < results.length; i++) {
        let result = results[i];

        if(result.status == "OKAY") {
            console.log(result.template);
        } else {
            console.log(result.template, object.template.error, "color: black");
        }
    }

    // PULA LINHA

    console.log("");

    // PRINT TOTAL DE inserts

    if(inserts.length > 0) {
        console.log("%cINSERTS: " + inserts.length, object.template.insert);
    }

    // PULA LINHA

    console.log("");

    // PRINT LISTA DE REGISTROS A SEREM REMOVIDOS

    if(acts.length > 0) {
        for(let i = 0; i < acts.length; i++) {
            let act = acts[i];
            console.log(i+1 + " - " + act.type + " %cREGISTRO " + act.reg, object.template.remove);
        }
    }

    // FUNÇÃO PARA REMOVER REGISTROS EXTRAS

    function do_remove_reg() {
        if(acts.length) {
           let regRef = $(acts[0].ref).find("input");
           object.remove_reg(regRef);
        }
    }

    // FUNÇÃO PARA INSERIR REGISTROS

    function do_insert_reg() {

        // SE NÃO HOUVER INSERTS, NÃO HÁ O QUE FAZER!
        if(inserts.length == 0) {
            return 0;
         }

        // TESTES

        if(prevElement == "") {
            object.insert_reg(insert, 1);
        }
        else if(prevElement == "01") {
            object.insert_reg(insert, 2);
        }
        else if(prevElement == "02") {
            object.insert_reg(insert, 3);
        }
        else if(prevElement == "03") {
            object.insert_reg(insert, 97);
        }
        else if(prevElement == "97") {
            if(nextElement == "99") {
                object.insert_reg(insert, 98);
            } else {
                object.insert_reg(insert, 3);
            }
        }
        else if(prevElement == "98") {
            object.insert_reg(insert, 99);
        }
        else {
            object.insert_reg(insert, 97);
        }
    }

    function do_save_reg() {
        object.save_reg();
    }

    if(acts.length == 0 && inserts.length == 0) {
        // SE TUDO ESTIVER OKAY, NÃO EXECUTA NADA
        console.log("NENHUMA AÇÃO A SER EXECUTADA!");

        // SALVAR ARQUIVO
        do_save_reg();

    } else {

        // CONFIRMA SE DESEJA CORRIGIR ARQUIVO
        var confirmation = confirm("Corrigir Arquivo ?");

        if(!confirmation) {
            alert("AÇÃO CANCELADA!");
        }
        else {
            do_remove_reg();
            do_insert_reg();
        }
    }

})({
  rows:    null,
  inserts: null,

  template: {
    okay:   null,
    error:  null,
    insert: null,
    remove: null
  },

  save_reg: function() {
    return null;
  },

  insert_reg: function(insert, type) {
    return null;
  },

  remove_reg: function(regRef) {
    return null;
  },

  nextInsert: function(insertRef) {
    return null;
  },
  prevInsert: function(insertRef) {
    return null;
  }

});

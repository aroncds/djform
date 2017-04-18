DJFORM - Django form Ajax
=======================

Ajudar a desenvolver formulários com requisições ajax.

Contém:
Validação,
Requisição ajax,
Máscara,

Exemplo
-------

```javascript
$("#id_form").djForm({
    "method": "", // http method da requisição.
    "url": "", // url para requisição XHR
    "inlines": [ ], // inlines para get de data
    "ignore_masks": [], // ignora mascara de campos
    "required": [], // campos required
    "blurValidate": true,
    "blurInvalidClass": "",
    "status_code": { // resposta da requisição.
      201: function(){ },
      200: function(){ },
      400: function(){ },
      500: function(){ }
    },
    validators: { password: PasswordValidator }
    onValidate: function(){ // validação customizada
        var pass= $("[name=password]");
        var c_pass = $("[name=confirm_password]");

        if (pass.val() === c_pass.val()){
            return true;
        }else{
            this.setMessage(pass, "Senhas nao coincidem");
            return false;
        }
    }
});

var PasswordValidator = function(){
    this.message = "Senha incorreta";

    this.clean = function(value){

    }
}
```
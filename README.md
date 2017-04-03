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
    "onValidate": function(){}, // validação customizada
    "status_code": { // resposta da requisição.
      201: function(){ },
      200: function(){ },
      400: function(){ },
      500: function(){ }
    }
});
```
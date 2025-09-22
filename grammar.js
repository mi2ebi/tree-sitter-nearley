module.exports = grammar({
  name: "nearley",
  extras: $ => [/\s+/, $.comment],
  rules: {
    source_file: $ => repeat($._item),
    _item: $ => choice(
      $.directive, $.rule, $.comment, $.cont_block, $.ifdef
    ),
    comment: $ => /#[^\n]*/,

    directive: $ => seq(/@[a-zA-Z_]\w*/, $.directive_value, /\n/),
    directive_value: $ => choice($.identifier, $.string),

    cont_block: $ => seq("@{%", optional($.cont), "%}"),
    cont: $ => /([^%]|%[^}])*/,
    cont_inline: $ => seq("{%", $.cont, "%}"),

    rule: $ => seq(choice($.rule_name, $.generic, $.macro_name), "->", $.rule_body, /\n/),
    rule_name: $ => $.identifier,
    rule_body: $ => sep1($.alternative, "|"),

    macro_name: $ => seq($.identifier, "[", sep1($.identifier, ","), "]"),
    macro_arg: $ => /\$[a-zA-Z_]\w*/,

    alternative: $ => prec.right(choice(
      seq(repeat1($.element), $.cont_inline),
      repeat1($.element)
    )),
    element: $ => choice($.symbol, $.quantified),
    symbol: $ => choice(
      $.identifier,
      $.string,
      $.group,
      $.macro_arg,
      $.charset,
      $.wildcard,
      $.token, // %token
      $.generic // Sym<P>
    ),
    token: $ => /%[a-zA-Z_]\w*/,
    generic: $ => seq($.identifier, "<", $.identifier, ">"),
    quantified: $ => seq($.symbol, $.quantifier),
    quantifier: $ => choice(":?", ":*", ":+"),

    group: $ => seq("(", $.rule_body, ")"),

    charset: $ => /\[\^?([^\]]|\\\])+\]/,
    wildcard: $ => ".",

    ifdef: $ => seq(
      $.ifdef_start,
      $.identifier,
      /\n/,
      repeat($._item),
      optional(seq(
        $.ifdef_else,
        repeat($._item)
      )),
      $.ifdef_endif
    ),
    ifdef_start: $ => "#ifdef",
    ifdef_else: $ => "#else",
    ifdef_endif: $ => "#endif",

    string: $ => choice(
      seq('"', /[^"]*/, '"', optional("i")),
      seq("'", /[^']*/, "'", optional("i"))
    ),
    identifier: $ => /[a-zA-Z_]\w*/
  }
});
function sep1(rule, delimiter) {
  return seq(rule, repeat(seq(delimiter, rule)))
}

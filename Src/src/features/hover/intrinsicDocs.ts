export interface MumpsIntrinsicDoc {
  token: string;
  name: string;
  description: string;
  syntax: string;
  example: string;
}

export const INTRINSIC_DOCS: MumpsIntrinsicDoc[] = [
  { token: '$P', name: '$PIECE', description: 'Returns or selects a delimited piece of a string.', syntax: '$PIECE(string,delimiter,piece)', example: 'SET NAME=$P(REC,"^",1)' },
  { token: '$G', name: '$GET', description: 'Returns a variable value, or a default when the variable is undefined.', syntax: '$GET(variable[,default])', example: 'SET X=$G(DATA,0)' },
  { token: '$O', name: '$ORDER', description: 'Returns next subscript.', syntax: '$ORDER(variable)', example: 'SET SUB=$O(^TMP($J,SUB))' },
  { token: '$D', name: '$DATA', description: 'Returns whether a variable has data and/or descendants.', syntax: '$DATA(variable)', example: 'IF $D(^DIC(9.4)) WRITE "Package file exists"' },
  { token: '$L', name: '$LENGTH', description: 'Returns the length of a string or the number of delimiter pieces.', syntax: '$LENGTH(string[,delimiter])', example: 'SET LEN=$L(NAME)' },
  { token: '$E', name: '$EXTRACT', description: 'Returns one or more characters from a string by position.', syntax: '$EXTRACT(string[,start[,end]])', example: 'SET INITIAL=$E(NAME,1)' },
  { token: '$F', name: '$FIND', description: 'Finds a substring and returns the position after the match.', syntax: '$FIND(string,substring[,start])', example: 'SET POS=$F(TEXT,"VA")' },
  { token: '$NA', name: '$NAME', description: 'Returns the canonical name of a local or global variable reference.', syntax: '$NAME(variable[,subscriptLevel])', example: 'SET ROOT=$NA(^TMP($J))' },
  { token: '$Q', name: '$QUERY', description: 'Returns the next local or global variable name in collating sequence.', syntax: '$QUERY(variable)', example: 'SET REF=$Q(^TMP($J))' },
  { token: '$QS', name: '$QSUBSCRIPT', description: 'Returns one subscript from a variable name string.', syntax: '$QSUBSCRIPT(name,integer)', example: 'SET SUB=$QS(REF,1)' },
  { token: '$QL', name: '$QLENGTH', description: 'Returns the number of subscripts in a variable name string.', syntax: '$QLENGTH(name)', example: 'SET DEPTH=$QL(REF)' },
  { token: '$TR', name: '$TRANSLATE', description: 'Replaces or removes selected characters from a string.', syntax: '$TRANSLATE(string,identifier[,associator])', example: 'SET CLEAN=$TR(TEXT," ")' },
  { token: '$RE', name: '$REVERSE', description: 'Returns a string with characters in reverse order.', syntax: '$REVERSE(string)', example: 'SET REV=$RE(TEXT)' },
  { token: '$J', name: '$JUSTIFY', description: 'Right-justifies and optionally formats a numeric expression.', syntax: '$JUSTIFY(expression,width[,decimal])', example: 'WRITE $J(AMOUNT,10,2)' },
  { token: '$ZDATE', name: '$ZDATE', description: 'Formats a date value using implementation-specific date formatting.', syntax: '$ZDATE(horologDate[,format])', example: 'WRITE $ZDATE($H)' },
  { token: '$HOROLOG', name: '$HOROLOG', description: 'Returns the current MUMPS date and seconds since midnight.', syntax: '$HOROLOG', example: 'WRITE $HOROLOG' }
];

const INTRINSIC_DOC_MAP = new Map(INTRINSIC_DOCS.flatMap((doc) => [[doc.token, doc], [doc.name, doc]]));

export function getIntrinsicDoc(token: string): MumpsIntrinsicDoc | undefined {
  return INTRINSIC_DOC_MAP.get(token.toUpperCase());
}

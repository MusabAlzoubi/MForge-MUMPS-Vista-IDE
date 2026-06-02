START ; ROUTINEA entry point
 D BUILD
 D EN^XUP
 S X=$$VALUE()
 S Y=$$VALUE^ROUTINEB()
 G EXIT
 ; D COMMENTED
 S STR="D STRINGONLY"
 Q
BUILD(DATA) ; Build a local value
 Q
VALUE() ; Local extrinsic
 Q 42
EXIT ; Local exit label
 Q

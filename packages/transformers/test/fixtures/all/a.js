function hello(indentSize, type) {
  if (indentSize === 4 && type !== 'tab') {
    	console.log('Each next indentation will increase on 4 spaces'); // [!code error] [!code focus]
  }

  // [!code focus]
  console.log('Should impact this line');

  console.log('Should keep the original comment'); // [!code focus] hello world

  // [!code highlight] [!code current]
  console.log("Don't impact this line")
}

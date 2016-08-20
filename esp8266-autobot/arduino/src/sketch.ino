
int LEFT_MOTOR  = 11;
int RIGHT_MOTOR = 10;


void setup() {

	pinMode(LEFT_MOTOR,  OUTPUT);
	pinMode(RIGHT_MOTOR, OUTPUT);

	analogWrite(LEFT_MOTOR,  0);
	analogWrite(RIGHT_MOTOR, 0);

	Serial.begin(9600);

}

void loop() {

	analogWrite(LEFT_MOTOR,  255);
	analogWrite(RIGHT_MOTOR, 255);
	delay(1);
	analogWrite(LEFT_MOTOR,  0);
	analogWrite(RIGHT_MOTOR, 0);
	// delay(6); // SLOW MODE  (  25cm / second)
	// delay(4); // FAST MODE  (~125cm / second)
	// delay(2); // ULTRA MODE (~300cm / second)
	// delay(0); // OMFG MODE  (lightspeed)

/*
	int state = analogRead(PIN_LEFT);
	int woot  = digitalRead(PIN_LEFT);

	Serial.println(state);
	Serial.println(woot);

	if (woot == 1) {
		analogWrite(PIN_LEFT, 0);
	} else {
		analogWrite(PIN_LEFT, 255);
	}
*/

}


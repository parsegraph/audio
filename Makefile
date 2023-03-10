DIST_NAME = audio

SCRIPT_FILES = \
	src/updateUnsel.ts \
	src/WaveShaperWidget.ts \
	src/EnvelopeGeneratorWidget.ts \
	src/index.ts \
	src/OnOffWidget.ts \
	src/SequencerWidget.ts \
	src/buildFullAudio.ts \
	src/FilterWidget.ts \
	src/EightBitWidget.ts \
	src/FlangerWidget.ts \
	src/ConvolverWidget.ts \
	src/SingleOscillatorWidget.ts \
	src/OscillatorWidget.ts \
	src/DelayWidget.ts \
	src/WhiteNoiseWidget.ts \
	src/SynthWidget.ts \
	src/demo.ts \
	test/test.ts

EXTRA_SCRIPTS =

include ./Makefile.microproject

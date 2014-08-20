BIN = ./node_modules/.bin/

test:
	@${BIN}mocha \
		--require should \
		--reporter spec \
		--timeout 3000

clean:
	@rm -rf node_modules

.PHONY: test clean

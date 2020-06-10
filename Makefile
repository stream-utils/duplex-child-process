BIN = ./node_modules/.bin/

test:
	@${BIN}mocha \
		--require should \
		--reporter spec \
		--timeout 3000

clean:
	@rm -rf node_modules

patch: test
	npm version patch -m "Bump version"
	git push origin master --tags
	npm publish

minor: test
	npm version minor -m "Bump version"
	git push origin master --tags
	npm publish

major: test
	npm version major -m "Bump version"
	git push origin master --tags
	npm publish

.PHONY: test clean

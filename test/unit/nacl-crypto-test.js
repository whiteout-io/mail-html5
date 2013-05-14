module("NaCl Crypto");

var nacl_test = {
	keySize: 128,
	nonceSize: 192
};

test("Init", 1, function() {
	// init dependencies
	nacl_test.util = new app.crypto.Util(window, uuid);
	ok(nacl_test.util, 'Util');
	// generate test data
	nacl_test.test_message = '06a9214036b8a15b512e03d534120006';
	nacl_test.crypto = new app.crypto.NaclCrypto(nacl, nacl_test.util);
});

asyncTest("Generate Keypair from seed", 1, function() {
	// generate keypair from seed
	var seed = nacl_test.util.random(128);
	nacl_test.crypto.generateKeypair(seed, function(keys) {
		ok(keys.boxSk && keys.boxPk && keys.id, "Keypair: " + JSON.stringify(keys));

		start();
	});
});

asyncTest("Generate Keypair", 2, function() {
	// generate keypair
	nacl_test.crypto.generateKeypair(null, function(senderKeypair) {
		ok(senderKeypair.boxSk && senderKeypair.boxPk, "Sender keypair: " + JSON.stringify(senderKeypair));

		nacl_test.crypto.generateKeypair(null, function(recipientKeypair) {
			ok(recipientKeypair.boxSk && recipientKeypair.boxPk, "Receiver keypair: " + JSON.stringify(recipientKeypair));

			nacl_test.senderKeypair = senderKeypair;
			nacl_test.recipientKeypair = recipientKeypair;

			start();
		});
	});
});

test("Asymmetric Encrypt (Synchronous)", 2, function() {
	var plaintext = nacl_test.test_message;

	var nonce = nacl_test.crypto.generateNonce();
	ok(nonce, 'Nonce: ' + nonce);
	nacl_test.nonce = nonce;

	// encrypt
	nacl_test.ct = nacl_test.crypto.asymEncryptSync(plaintext, nonce, nacl_test.recipientKeypair.boxPk, nacl_test.senderKeypair.boxSk);
	ok(nacl_test.ct, 'Ciphertext length: ' + nacl_test.ct.length);
});

test("Asymmetric Decrypt (Synchronous)", 1, function() {
	var plaintext = nacl_test.test_message;

	var nonce = nacl_test.nonce

	// decrypt
	var decrypted = nacl_test.crypto.asymDecryptSync(nacl_test.ct, nonce, nacl_test.senderKeypair.boxPk, nacl_test.recipientKeypair.boxSk);
	equal(decrypted, plaintext, 'Decryption correct: ' + decrypted);
});

asyncTest("Asymmetric En/Decrypt (Async/Worker)", 3, function() {
	var plaintext = nacl_test.test_message;

	var nonce = nacl_test.crypto.generateNonce();
	ok(nonce, 'Nonce: ' + nonce);
	// encrypt
	nacl_test.crypto.asymEncrypt(plaintext, nonce, nacl_test.recipientKeypair.boxPk, nacl_test.senderKeypair.boxSk, function(ct) {
		ok(ct, 'Ciphertext length: ' + ct.length);

		// decrypt
		nacl_test.crypto.asymDecrypt(ct, nonce, nacl_test.senderKeypair.boxPk, nacl_test.recipientKeypair.boxSk, function(decrypted) {
			equal(decrypted, plaintext, 'Decryption correct: ' + decrypted);

			start();
		});
	});
});
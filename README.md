# UTONIC-Badge

## install dependencies

```
$ npm install
```

## configuration

```
$ vim config.ini
```

write following content into the file

```
network=mainnet
badge_collection=${badge collection address}
badge_item_content="${a string, usually a url of your item content}"
words=${your secret key words of ton network}
```

## mint

```
$ npx blueprint run
```

then select `scripts/mint.ts` and then simply operate with following selections printed on terminal to select network and ton wallet.
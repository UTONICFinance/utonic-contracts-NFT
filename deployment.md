## utonic contracts NFT

### clone and build

```
$ git clone git@github.com:UTONICFinance/utonic-contracts-NFT.git
$ cd utonic-contracts-NFT
$ npm install
$ mkdir build
$ yarn compilecollection
$ yarn compileitem
```

### deploy collection

create and edit `config.ini`

```
network=mainnet

;; just fill following with value, not used in contract
numerator=0
denominator=10000

;; just fill with admin address, not used in contract
destination=${destination address}

;; fill collection before mint
;; or update "badge item content" for user
badge_collection=

;; item content for user's badge, usually a json url
badge_item_content=abcdefg.json

;; admin address of collection
admin_address=${admin address}
words=${mnemonic words}

user_address=${user address}
;; true | false, 
;; false to ban user's authority to update his or her item content.
enable=
```

before deploying collection, we should fill `destination` and `admin_address`.

deploy:

```
$ npx blueprint run
```

select `deployCollection` and `mainnet`, you may also need to sign in your `tonkeeper` or other wallet if you first run this.

### user mint

any user can mint by him or herself.
fill `badge_collection` (address) and `badge_item_content` (user's url) in `config.ini`, then run following command

```
$ npx blueprint run
```

then user can select `mint` to mint a badge for him or herself.

### user update badge item content

any user can update badge item content if he or she is not baned by admin.
fill `badge_collection` (address) and update `badge_item_content` (user's new url) in `config.ini`, then run following command

```
$ npx blueprint run
```

and select `userUpdateBadgeItemContent`

### admin ban a user's update authority

fill following fields in `config.ini`

```
;; address of badge collection
badge_collection=...
;; address of user to ban
user_address=...
enable=false
```

then 

```
$ npx blueprint run
```

select `collectionSwitchItemUpdateContent`


### admin directly update user's content

fill following fields in `config.ini`

```
;; address of badge collection
badge_collection=...

;; new content of user
badge_item_content=...
;; address of user to ban
user_address=...
```

then

```
$ npx blueprint run
```

select `collectionUpdateBadgeItemContent`.
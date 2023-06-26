export const generateCode = (
  metadata,
  tokenIdentifierProperty
) => `
import json
import os

from open_rarity import (
    Collection,
    Token,
    RarityRanker,
    TokenMetadata
)
from open_rarity.models.token_metadata import (
    StringAttribute,
)
from open_rarity.models.token_identifier import EVMContractTokenIdentifier
from open_rarity.models.token_standard import TokenStandard
 
def rank_tokens(metadata, tokenIdentifierProperty):
    # Build OpenRarity collection object
    tokens = []
    
    # Decode metadata JSON.
    metadata = json.loads(metadata)

    for token in metadata:
        string_attributes = dict()
        for trait in token["attributes"]:
            string_attributes[trait["trait_type"]] = StringAttribute(name=trait["trait_type"], value=trait["value"])

        tokens.append(Token(
            token_identifier=EVMContractTokenIdentifier(
                contract_address='0x0', token_id=token[tokenIdentifierProperty]
            ),
            token_standard=TokenStandard.ERC721,
            metadata=TokenMetadata(
                string_attributes=string_attributes,
            ),
        ),)

    collection = Collection(
        name='ERC721',
        tokens=tokens
    )

    # Iterate through ranked tokens & build JSON
    ranked_tokens = []
    for token_rarity in RarityRanker.rank_collection(collection=collection):
        token = dict()

        token["tokenID"] = token_rarity.token.token_identifier.token_id
        token["rank"] = token_rarity.rank
        token["score"] = token_rarity.score

        ranked_tokens.append(token)

    # Return Tokens
    return ranked_tokens
    
# Execute the function
rank_tokens('${metadata}', '${tokenIdentifierProperty}')`;
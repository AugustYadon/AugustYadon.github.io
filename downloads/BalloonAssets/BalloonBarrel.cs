using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class BalloonBarrel : MonoBehaviour {


    public Animator[] anims;
    float jiggle_layer_weight = 0;
    bool jiggling = false;
    public Transform balloon_slot;

    private void Start()
    {
        for (int i = 0; i < anims.Length; i++) { anims[i].SetLayerWeight(1, 0f); }
    }

    public void Jiggle()
    {
        if (!jiggling) { jiggling = true; StartCoroutine(Jiggling());}
    }

    IEnumerator Jiggling()
    {

        
        jiggle_layer_weight = 0.5f;
        for (int i = 0; i < anims.Length; i++) { anims[i].SetLayerWeight(1, jiggle_layer_weight); }
        while (jiggle_layer_weight > 0f)
        {
            jiggle_layer_weight = Mathf.Clamp(jiggle_layer_weight - (2f * Time.deltaTime), 0, 0.5f);
            for (int i = 0; i < anims.Length; i++) { anims[i].SetLayerWeight(1, jiggle_layer_weight); }
            yield return null;
        }
        jiggling = false;
        yield return null;
    }
	

}
